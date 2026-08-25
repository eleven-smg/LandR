"use client"

import { useState } from "react"
import type { CSSProperties } from "react"
import ActionForm from "./ActionForm"
import SaveButton from "./SaveButton"
import { saveAvatar, removeAvatar } from "./mediaActions"
import { saveAvatarFocus } from "./actions"

const input: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "#0f1117",
  border: "1px solid #232940",
  borderRadius: 8,
  color: "#fff",
  boxSizing: "border-box",
}
const rowStyle: CSSProperties = { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 8 }
const fileIn: CSSProperties = { ...input, flex: 1, minWidth: 150, padding: "6px 8px" }
const pasteIn: CSSProperties = { ...input, flex: 1, minWidth: 120 }
const lbl: CSSProperties = { fontSize: 12, color: "#9aa4c2", display: "block", marginTop: 8 }
const hint: CSSProperties = { color: "#6b7396", fontSize: 11, marginTop: 8 }
const circle: CSSProperties = {
  width: 96,
  height: 96,
  borderRadius: "50%",
  overflow: "hidden",
  border: "1px solid #232940",
  flexShrink: 0,
  cursor: "crosshair",
  background: "#0f1117",
}
const sliders: CSSProperties = { flex: 1, minWidth: 170 }
const range: CSSProperties = { width: "100%", marginTop: 2 }
const placeholder: CSSProperties = {
  width: 96,
  height: 96,
  borderRadius: "50%",
  border: "1px dashed #3a4468",
  color: "#6b7396",
  fontSize: 11,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: 8,
  boxSizing: "border-box",
}

/**
 * The profile photo gets the same tap-to-crop treatment as the background, so a
 * portrait taken for Instagram can be framed on the face instead of the middle.
 */
export default function AvatarCard({
  handle,
  creatorId,
  photoUrl,
  posX,
  posY,
  zoom,
}: {
  handle: string
  creatorId: string
  photoUrl: string
  posX: number
  posY: number
  zoom: number
}) {
  const [x, setX] = useState(posX)
  const [y, setY] = useState(posY)
  const [z, setZ] = useState(zoom)

  const imgStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: x + "% " + y + "%",
    transform: z === 100 ? undefined : "scale(" + z / 100 + ")",
  }

  function pick(event: React.MouseEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    setX(Math.min(100, Math.max(0, Math.round(((event.clientX - box.left) / box.width) * 100))))
    setY(Math.min(100, Math.max(0, Math.round(((event.clientY - box.top) / box.height) * 100))))
  }

  return (
    <div>
      <div style={rowStyle}>
        {photoUrl ? (
          <div style={circle} onClick={pick} title="Tap the part of the photo to keep">
            <img src={photoUrl} alt="" style={imgStyle} />
          </div>
        ) : (
          <div style={placeholder}>no photo yet</div>
        )}
        {photoUrl ? (
          <div style={sliders}>
            <ActionForm action={saveAvatarFocus}>
              <input type="hidden" name="handle" value={handle} />
              <label style={lbl}>
                Left to right: {x}%
                <input
                  style={range}
                  type="range"
                  min={0}
                  max={100}
                  name="photo_pos_x"
                  value={x}
                  onChange={(event) => setX(Number(event.target.value))}
                />
              </label>
              <label style={lbl}>
                Top to bottom: {y}%
                <input
                  style={range}
                  type="range"
                  min={0}
                  max={100}
                  name="photo_pos_y"
                  value={y}
                  onChange={(event) => setY(Number(event.target.value))}
                />
              </label>
              <label style={lbl}>
                Zoom: {z}%
                <input
                  style={range}
                  type="range"
                  min={100}
                  max={300}
                  step={5}
                  name="photo_zoom"
                  value={z}
                  onChange={(event) => setZ(Number(event.target.value))}
                />
              </label>
              <SaveButton label="Save crop" />
            </ActionForm>
          </div>
        ) : null}
      </div>

      <ActionForm action={saveAvatar} encType="multipart/form-data" style={rowStyle}>
        <input type="hidden" name="handle" value={handle} />
        <input type="hidden" name="creator_id" value={creatorId} />
        <input style={fileIn} type="file" name="photo_file" accept="image/*" />
        <input style={pasteIn} name="photo_url" placeholder="or paste an image URL" />
        <SaveButton label="Save photo" variant="ghost" />
      </ActionForm>

      {photoUrl ? (
        <ActionForm action={removeAvatar} style={rowStyle}>
          <input type="hidden" name="handle" value={handle} />
          <SaveButton label="Remove photo" variant="danger" confirm="Remove the profile photo?" />
        </ActionForm>
      ) : null}

      <p style={hint}>
        Tap the circle to choose what stays in frame, then Save crop. Each upload gets a fresh filename, so a new photo
        shows up immediately.
      </p>
    </div>
  )
}
