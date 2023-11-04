import { PackBundle, PackData, PackDependency } from 'data-types';
import { useEffect, useRef, useState } from 'react';
import { DownloadButton, IconTextButton } from 'components';
import { useAppDispatch, useFirebaseUser } from 'hooks';
import { Check, Cross, Folder, Gear, NewFolder, Trash } from 'components/svg';
import { setSelectedBundle } from 'store';


export function BundleCard({ id, editable, showOwner, bundleDownloadButton: DownloadButton }: { id: string; editable: boolean; showOwner?: boolean; bundleDownloadButton: DownloadButton; }) {
    const [rawBundleData, setRawBundleData] = useState<PackBundle | undefined>();
    const [containedPacks, setContainedPacks] = useState<[string, string, string][]>();
    const [ownerName, setOwnerName] = useState('');
    const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
    const [injectPopup, setInjectPopup] = useState<undefined | JSX.Element>(undefined);
    const parentElement = useRef<HTMLDivElement>(null);
    const firebaseUser = useFirebaseUser();
    const dispatch = useAppDispatch();

    async function getPackName(pack: PackDependency): Promise<[string, string, string] | undefined> {
        const resp = await fetch(`https://api.smithed.dev/v2/packs/${pack.id}`);
        if (!resp.ok)
            return undefined;
        const data: PackData = await resp.json();

        return [pack.id, data.display.name, pack.version];
    }
    async function getOwnerName(uid: string) {
        const resp = await fetch(`https://api.smithed.dev/v2/users/${uid}`);
        if (!resp.ok)
            return;

        const data: { displayName: string; } = await resp.json();

        setOwnerName(data.displayName);
    }

    async function loadBundleData() {
        const resp = await fetch(`https://api.smithed.dev/v2/bundles/${id}`);

        if (!resp.ok)
            return;

        const data: PackBundle = await resp.json();

        const promises = data.packs.map(p => getPackName(p));
        const results = (await Promise.all(promises)).filter(r => r !== undefined);

        await getOwnerName(data.owner);

        setRawBundleData(data);
        setContainedPacks(results as [string, string, string][]);
    }

    useEffect(() => { loadBundleData(); }, [id]);

    if (rawBundleData === undefined) return <div style={{ display: 'none' }} />;

    return <div className='container' style={{ flexDirection: 'row', width: '100%', padding: 16, borderRadius: 'var(--defaultBorderRadius)', backgroundColor: 'var(--section)', boxSizing: 'border-box', gap: 16 }} ref={parentElement}>

        <div className='container' style={{ alignItems: 'start', gap: '1rem', flexGrow: 1, justifyContent: 'start', height: '100%' }}>
            <div className='container' style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ display: 'flex', fontSize: '1.5rem', fontWeight: 600, gap: '1rem', alignItems: 'center'}}>
                    <Folder style={{width: '1.5rem', height: '1.5rem'}}/>
                    {rawBundleData.name}
                </span>

                <div style={{ display: 'flex', fontSize: '1rem', alignItems: 'center', gap: '1rem', borderRadius: 'var(--defaultBorderRadius)', backgroundColor: 'var(--bold)', padding: '0.5rem 1rem' }}>
                    <Gear />{rawBundleData.version}
                </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxHeight: '5rem', overflow: 'hidden'}}>
                {containedPacks?.map(p => <div style={{ display: 'flex', backgroundColor: 'var(--bold)', alignItems: 'center', gap: '1rem', padding: '0.5rem 1rem', borderRadius: 'var(--defaultBorderRadius)' }}>
                    <a className="compactButton" href={`/packs/${p[0]}`}>{p[1]}</a>
                    <div style={{ width: 2, height: '100%', backgroundColor: 'var(--border)' }} />
                    {p[2].startsWith('v') ? '' : 'v'}{p[2]}
                </div>)}
                {(containedPacks === undefined || containedPacks.length === 0) && <label style={{ color: 'var(--subText)' }}>No packs added</label>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <span style={{ opacity: 0.4 }}>By {ownerName}</span>
                <div style={{ flexGrow: 1 }} />
                <div className='container bundleControls'>
                    {editable && <div className="buttonLike invalidButtonLike bundleControlButton" onClick={() => {
                        setShowConfirmation(true);
                    }}>
                        <Trash fill="var(--disturbing)" />
                    </div>}
                    {editable && <a className='buttonLike highlightButtonLike bundleControlButton' href={`/browse`} onClick={(e) => {
                        dispatch(setSelectedBundle(rawBundleData.uid));
                    }}><NewFolder /></a>}
                    {rawBundleData.uid !== undefined && <DownloadButton id={rawBundleData.uid} openPopup={(element) => { setInjectPopup(element); }} closePopup={() => { setInjectPopup(undefined); }}/>}
                    {/* <IconTextButton text={"Download"} iconElement={<Download fill="var(--foreground)" />} className="accentedButtonLike bundleControlButton" reverse={true} href={`https://api.smithed.dev/v2/bundles/${rawBundleData.uid}/download`} /> */}
                </div>
            </div>

        </div>
        {showConfirmation && <div className='container' style={{ position: 'fixed', zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', width: '100%', height: '100%', top: 0, left: 0, justifyContent: 'center', animation: 'fadeInBackground 1s' }}>
            <div className='container' style={{ backgroundColor: 'var(--background)', borderRadius: 'var(--defaultBorderRadius)', padding: 16, animation: 'slideInContent 0.5s ease-in-out', border: '2px solid var(--border)', gap: 16 }}>
                <h3 style={{ margin: 4 }}>Are you sure you want to remove "{rawBundleData.name}"?</h3>
                <div className='container' style={{ flexDirection: 'row', gap: 16 }}>
                    <IconTextButton className="accentedButtonLike" text={"Cancel"} icon={Cross} onClick={() => setShowConfirmation(false)} />
                    <IconTextButton className="invalidButtonLike" text={"Confirm"} icon={Check} onClick={async () => {
                        if (firebaseUser == null)
                            return setShowConfirmation(false);
                        const resp = await fetch(`https://api.smithed.dev/v2/bundles/${rawBundleData.uid}?token=${await firebaseUser.getIdToken()}`, { method: 'DELETE' });
                        if (!resp.ok) {
                            alert(resp.statusText);
                        } else {
                            parentElement.current?.style.setProperty('display', 'none');
                        }
                        setShowConfirmation(false);
                    }} />
                </div>
            </div>
        </div>}
        {injectPopup}
    </div>;
}
