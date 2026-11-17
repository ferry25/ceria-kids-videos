// Run inside studio.youtube.com (built-in browser javascript_tool) after the
// "Upload video" dialog is open. Replace VIDEO_URL with the raw GitHub URL of
// today's mp4. It downloads the file in the page and hands it to YouTube's
// own file input, so no native file picker is needed.
const VIDEO_URL = "__VIDEO_URL__";
const FILE_NAME = "__FILE_NAME__";
const res = await fetch(VIDEO_URL);
if (!res.ok) throw new Error("download failed " + res.status);
const blob = await res.blob();
const file = new File([blob], FILE_NAME, { type: "video/mp4" });
const input = document.querySelector('ytcp-uploads-file-picker input[type=file], input[type=file][name=Filedata], ytcp-uploads-dialog input[type=file]');
if (!input) throw new Error("file input not found; is the upload dialog open?");
const dt = new DataTransfer();
dt.items.add(file);
input.files = dt.files;
input.dispatchEvent(new Event("change", { bubbles: true }));
`injected ${FILE_NAME} (${(blob.size / 1e6).toFixed(1)} MB)`;
