import React, { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [textPreview, setTextPreview] = useState("");

  const handleUpload = async () => {
    if (!file) return alert("Please select a file");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/upload",
        formData
      );

      setAudioUrl(res.data.audioUrl);
      setTextPreview(res.data.text);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "30px" }}>
      <h2>📄 PDF/Word to Speech</h2>

      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br /><br />

      <button onClick={handleUpload}>
        {loading ? "Processing..." : "Upload & Convert"}
      </button>

      <br /><br />

      {textPreview && (
        <>
          <h4>Preview:</h4>
          <p>{textPreview}</p>
        </>
      )}

      {audioUrl && (
        <>
          <h4>🔊 Audio:</h4>
          <audio controls src={audioUrl}></audio>
        </>
      )}
    </div>
  );
}

export default App;