import { useState, useEffect, useCallback } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx"; // Додаємо бібліотеку для роботи з Excel

export default function CardIdJsonGenerator() {
  const [ids, setIds] = useState([]);
  const [jsonOutput, setJsonOutput] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOverPage, setIsDragOverPage] = useState(false);
  const [template, setTemplate] = useState(
    JSON.stringify(
      {
        id: 1,
        name: "empty",
        description: "",
        is_active: 1,
        type: "card",
        value: "",
        owner_type: "owner",
        period_restrict_active: false,
        period_restrict_from: null,
        period_restrict_to: null,
        passes_restrict_active: false,
        passes_restrict_max_count: 0,
        passes_restrict_passes_count: 0,
        last_used_at: null,
        owner_id: 609,
        token: null,
        project_id: 1,
        isValid: true,
        is_valid: true,
        face_data: null,
      },
      null,
      2
    )
  );

  useEffect(() => {
    const storedIds = localStorage.getItem("cardIds");
    if (storedIds) setIds(JSON.parse(storedIds));
  }, []);

  const generateJson = useCallback(() => {
    try {
      const parsedTemplate = JSON.parse(template);
      const jsonData = ids.map((id, index) => ({
        ...parsedTemplate,
        id: index + 1,
        name: `${parsedTemplate.name} ${index + 1}`,
        value: id,
      }));
      setJsonOutput(jsonData);
    } catch {
      setJsonOutput([]);
    }
  }, [ids, template]);

  useEffect(() => {
    localStorage.setItem("cardIds", JSON.stringify(ids));
    generateJson();
  }, [ids, template, generateJson]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (fileExtension === "txt") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        setIds(
          text
            .split(/\s*[,\n]\s*/)
            .map((id) => id.trim())
            .filter(Boolean)
        );
      };
      reader.readAsText(file);
    } else if (fileExtension === "xlsx") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Витягуємо значення лише з першого стовпця, ігноруючи заголовки
        const extractedIds = rows
          .slice(1) // Пропускаємо заголовок (перший рядок)
          .map((row) => (row[0] ? row[0].toString().trim() : null))
          .filter(Boolean);

        setIds(extractedIds);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Непідтримуваний формат файлу. Використовуйте .txt або .xlsx.");
    }
  };

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setIsDragging(false);
    setIsDragOverPage(false);
    const file = event.dataTransfer.files[0];
    if (file) handleFileUpload({ target: { files: [file] } });
  }, []);

  useEffect(() => {
    const handleDragOver = (event) => {
      event.preventDefault();
      setIsDragOverPage(true);
    };
    const handleDragLeave = () => {
      setIsDragOverPage(false);
    };
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [handleDrop]);

  const handleDownload = () => {
    try {
      JSON.parse(template);
      saveAs(
        new Blob([JSON.stringify(jsonOutput, null, 2)], {
          type: "application/json",
        }),
        "card_ids.json"
      );
    } catch {
      alert(
        "Невірний формат JSON. Будь ласка, виправте помилку перед завантаженням."
      );
    }
  };

  return (
    <div className={`container ${isDragOverPage ? "dragging-page" : ""}`}>
      <h1>BAS-IP ID Formatter</h1>
      <p>
        Завантажте файл для створення JSON (має бути у вигляді списку
        індифікаторів у txt / word / excel)
      </p>

      <div
        className={`drop-zone ${isDragging ? "dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          id="file-upload"
          type="file"
          accept=".txt,.xlsx"
          onChange={handleFileUpload}
          className="hidden-input"
        />
        <label htmlFor="file-upload" className="drop-button">
          Обреріть або перетягніть файл 📂
        </label>
      </div>

      <button onClick={handleDownload} className="button">
        Завантажити JSON
      </button>

      <div className="json-container">
        <div className="json-box">
          <h3>Редагуйте JSON-шаблон</h3>
          <textarea
            rows="10"
            placeholder="Редагуйте JSON-шаблон тут"
            onChange={(e) => setTemplate(e.target.value)}
            value={template}
          />
        </div>
        <div className="json-box">
          <h3>Згенерований JSON</h3>
          <pre>{JSON.stringify(jsonOutput, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
