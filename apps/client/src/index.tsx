import { NavBar, RootError } from 'components'
import { useEffect, useState, useTransition } from 'react'
import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration, useLocation } from 'react-router-dom'
import { initializeApp } from 'firebase/app'
import { User as FirebaseUser } from 'firebase/auth'

import Browse from './pages/browse.js'
import Home from './pages/home.js'
import Packs, { loadPackData } from './pages/pack.js'
import './style.css'

import Account from './pages/account.js'
import { getAuth } from 'firebase/auth'
import Edit from './pages/edit.js'
import Bundles from './pages/bundle.js'
import Settings from './pages/settings.js'

import { Provider } from 'react-redux'
import { loadBrowseData, loadHomePageData, loadUserPageData } from './loaders.js'
import User from './pages/user.js'
import { selectSelectedBundle, selectUsersBundles, setSelectedBundle, setUsersBundles, store } from 'store'
import { useAppDispatch, useAppSelector } from 'hooks'
import { PackBundle } from 'data-types'
import { Helmet } from 'react-helmet'
import { ClientInject, getDefaultInject } from './inject.js'

import { Cross, Logo } from 'components/svg.js'

export type { ClientInject } from './inject.js'

interface ClientProps {
    platform: 'desktop' | 'website',
    inject: ClientInject,
}

initializeApp({
    databaseURL: "https://mc-smithed-default-rtdb.firebaseio.com",
    apiKey: "AIzaSyDX-vLCBhO8StKAxnpvQ2EW8lz3kzYn4Qk",
    authDomain: "mc-smithed.firebaseapp.com",
    projectId: "mc-smithed",
    storageBucket: "mc-smithed.appspot.com",
    messagingSenderId: "574184244682",
    appId: "1:574184244682:web:498d168c09b39e4f0d7b33",
    measurementId: "G-40SRKC35Z0"
})



export function ClientApplet(props: ClientProps) {
    const dispatch = useAppDispatch()
    const selectedBundle = useAppSelector(selectSelectedBundle)
    const [hideWarning, setHideWarning] = useState(false)
    const location = useLocation();

    function resetBundleData() {
        dispatch(setUsersBundles([]))
        dispatch(setSelectedBundle(''))
    }

    async function loadBundles(user: FirebaseUser | null) {
        if (user == null) {
            return resetBundleData()
        }

        const resp = await fetch(`https://api.smithed.dev/v2/users/${user.uid}/bundles`)
        if (!resp.ok)
            return resetBundleData()

        const bundleIds: string[] = await resp.json()

        if (bundleIds.find(b => b === selectedBundle) === undefined)
            dispatch(setSelectedBundle(''))

        const getData = async (id: string) => {
            const resp = await fetch(`https://api.smithed.dev/v2/bundles/${id}`)

            if (!resp.ok)
                return undefined

            return await resp.json() as PackBundle
        }
        const bundles = (await Promise.all(bundleIds.map(id => getData(id)))).filter(b => b !== undefined)
        dispatch(setUsersBundles(bundles))
    }

    useEffect(() => {
        if (import.meta.env.SSR)
            return

        setHideWarning(!!sessionStorage.getItem("hereBeDragons"))

        const unsub = getAuth().onAuthStateChanged(async user => {
            await loadBundles(user)
        })

        return () => {
            unsub()
        }
    }, [])

    return <div className="container" style={{ position: 'absolute', top: 0, left: 0, height: '100%', boxSizing: 'border-box', justifyContent: 'safe start', alignItems: 'center', width: '100%', overflowY: 'auto', overflowX: 'hidden', scrollbarGutter: 'stable' }}>
        <ScrollRestoration />
        <Helmet>
            <title>Smithed</title>
            <meta name="description" content="Datapacks: the community, the tooling; all bundled into the perfect package." />
            <meta name="og:image" content="/icon.png" />
        </Helmet>
        {import.meta.env.VITE_NIGHTLY && !hideWarning && <div id="nightlyWarningBar" style={{
            width: '100%',
            borderBottom: '0.125rem solid var(--warning)',
            backgroundColor: 'color-mix(in srgb, transparent 80%, var(--warning) 20%)',
            padding: '0.5rem 1rem', boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'row',
            position: 'relative',
        }}>
            <span>
                {"You are currently on the unstable branch. "}
                <a href={"https://smithed.net" + location.pathname + location.search}>Click here</a>
                {" to go to safety."}
            </span>
            <Cross style={{ alignSelf: 'center', position: 'absolute', right: '1rem'}} onClick={() => {
                sessionStorage.setItem("hereBeDragons", "true")
                const warningBar = document.getElementById("nightlyWarningBar")
                if (warningBar == null) 
                    return setHideWarning(true)

                warningBar.animate([
                    {marginTop: "0"},
                    {marginTop: `-${warningBar.clientHeight}px`}
                ], {easing: 'ease-in-out', duration: 200})

                setTimeout(() => setHideWarning(true), 199)
            }}/>
        </div>}
        <div className='container outlet' style={{ width: 'min(70rem, 100%)', gap: '4rem', boxSizing: 'border-box', flexGrow: 1, justifyContent: 'start', paddingTop: '1rem', paddingBottom: '1rem' }}>
            <NavBar getTabs={props.inject.getNavbarTabs} logoUrl={props.inject.logoUrl} />
            <Outlet />
        </div>
        {props.inject.enableFooter ? <Footer /> : <br />}
    </div>
}

function Footer() {
    return <div className='container' style={{ width: '100%', backgroundColor: 'var(--bold)', borderTop: '0.125rem solid var(--border)' }}>
        <div className="footerContainer" style={{ width: 'min(70rem, 100vw)', paddingLeft: 16 }}>
            <div className='container footerLargeGroup'>
                <div className="container" style={{ flexDirection: 'row', fontWeight: 600, fontSize: '3rem', justifyContent: 'center', gap: 10 }}>
                    <Logo style={{ height: '4rem', width: '4rem' }} />
                    Smithed
                </div>

                <p style={{ color: 'var(--border)' }}>
                    <b>Copyright © 2023 Smithed</b><br />
                    Not an official Minecraft product. Not approved by or associated with Mojang Studios
                </p>
            </div>
            <div className='container footerSmallGroup'>
                <b style={{ fontSize: '1.5rem' }}>SOCIAL</b>
                <a className='compactButton' href="https://smithed.dev/discord">Discord</a>
                <a className='compactButton' href="https://github.com/Smithed-MC">Github</a>
            </div>
            <div className='container footerSmallGroup'>
                <b style={{ fontSize: '1.5rem' }}>POLICIES</b>
                <a className='compactButton'>Terms of service</a>
                <a className='compactButton'>Privacy policy</a>
                <a className='compactButton'>Guidelines</a>

            </div>
        </div>
    </div>;
}

// Don't reorder these please
export const subRoutes: any[] = [
    {
        path: "",
        element: <Home />,
        loader: loadHomePageData
    },
    {
        path: "settings",
        element: <Settings />
    },
    {
        path: "browse",
        element: <Browse />,
        loader: loadBrowseData
    },
    {
        path: "account",
        element: <Account />
    },
    {
        path: "edit",
        element: <Edit />,
    },
    {
        path: ":owner",
        element: <User showBackButton={getDefaultInject().showBackButton} bundleDownloadButton={getDefaultInject().bundleDownloadButton} />,
        loader: loadUserPageData
    },
    {
        path: "packs/:id",
        element: <Packs packDownloadButton={getDefaultInject().packDownloadButton} showBackButton={getDefaultInject().showBackButton} />,
        loader: loadPackData
    },
    {
        path: 'bundles/:bundleId',
        element: <Bundles buttonDownloadFn={getDefaultInject().bundleDownloadButton} />
    }
]

export const routes = [
    {
        path: '/',
        children: subRoutes,
        element: <Provider store={store}>
            <ClientApplet platform='website' inject={getDefaultInject()} />
        </Provider>,
        errorElement: <RootError />
    }
]

// Set the default client applet to one with different props
export function populateRouteProps(props: ClientProps) {
    console.log("Populate");
    routes[0].element = <Provider store={store}>
        <ClientApplet {...props} />
    </Provider>;
    subRoutes[5].element = <User showBackButton={props.inject.showBackButton} bundleDownloadButton={props.inject.bundleDownloadButton} />;
    subRoutes[6].element = <Packs packDownloadButton={props.inject.packDownloadButton} showBackButton={props.inject.showBackButton} />;
}

export default function Client({ platform }: ClientProps) {
    const router = createBrowserRouter(routes)
    return <RouterProvider router={router} />
}
