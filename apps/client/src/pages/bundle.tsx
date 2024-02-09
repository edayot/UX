import { useParams } from "react-router-dom"
import { BundleCard } from "components/BundleCard"
import { DownloadButton } from "components"

export default function Bundles({
	buttonDownloadFn,
}: {
	buttonDownloadFn: DownloadButton
}) {
	const { bundleId } = useParams()

	if (!bundleId) return <div></div>

	return (
		<div
			className="container"
			style={{
				width: "100%",
				height: "100%",
				justifyContent: "center",
				alignItems: "center",
				position: "absolute",
				left: 0,
				top: 0,
			}}
		>
			<div className="container" style={{ maxWidth: "75%" }}>
				<BundleCard
					id={bundleId}
					editable={false}
					showOwner
					bundleDownloadButton={buttonDownloadFn}
				/>
			</div>
		</div>
	)
}
