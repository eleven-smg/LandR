const wrap = {
  padding: 24,
  color: "#8892a4",
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  gap: 10,
}
const dot = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "#5b7fff",
  animation: "landrPulse 1s ease-in-out infinite",
}
const css = "@keyframes landrPulse { 0%, 100% { opacity: .25 } 50% { opacity: 1 } }"

/**
 * Without this, tapping a sidebar tab looked like nothing happened until the
 * next page finished loading, so tabs got tapped several times.
 */
export default function Loading() {
  return (
    <div style={wrap}>
      <style>{css}</style>
      <span style={dot} />
      Loading...
    </div>
  )
}
