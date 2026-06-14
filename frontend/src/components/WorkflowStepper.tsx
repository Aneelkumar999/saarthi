"use client";

import { useState } from "react";

interface WorkflowService {
  id: number;
  name: string;
  department: string;
  sla_days: number;
  description: string;
  fee: number;
}

export interface WorkflowStep {
  status: "completed" | "pending" | "upcoming";
  service: WorkflowService;
}

interface FilledFormField {
  label: string;
  value: string;
}

interface FilledForm {
  form_name: string;
  fields: FilledFormField[];
}

export default function WorkflowStepper({ workflow }: { workflow: WorkflowStep[] }) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [filledForm, setFilledForm] = useState<FilledForm | null>(null);

  const handleFileUpload = async (serviceId: number, file: File) => {
    setUploading(serviceId.toString());
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/documents/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        alert("Document uploaded and data extracted!");
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(null);
    }
  };

  const handleApply = async (serviceId: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/forms/generate/${serviceId}`);
      if (res.ok) {
        const data = await res.json();
        setFilledForm(data);
      }
    } catch (err) {
      console.error("Form generation failed", err);
    }
  };

  return (
    <div className="space-y-8 relative">
      {workflow.map((step, i) => (
        <div key={i} className="relative flex gap-6">
          {/* Connector Line */}
          {i !== workflow.length - 1 && (
            <div className="absolute left-[1.125rem] top-10 bottom-[-2rem] w-0.5 bg-slate-200"></div>
          )}
          
          {/* Step Number Circle */}
          <div className={`z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
            step.status === "completed"
              ? "bg-green-500 text-white"
              : step.status === "pending"
                ? "bg-indigo-600 text-white ring-4 ring-indigo-50"
                : "bg-slate-200 text-slate-500"
          }`}>
            {step.status === "completed" ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            ) : i + 1}
          </div>
          
          {/* Content Card */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold text-slate-800 text-lg">{step.service.name}</h4>
                <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">{step.service.department}</p>
              </div>
              <div className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded">
                {step.service.sla_days} Days SLA
              </div>
            </div>
            
            <p className="text-slate-600 text-sm mb-4">{step.service.description}</p>
            
            <div className="border-t pt-4 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2 items-center">
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-3 py-2 rounded-lg transition border border-slate-200 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  {uploading === step.service.id.toString() ? "Uploading..." : "Upload ID"}
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => e.target.files && handleFileUpload(step.service.id, e.target.files[0])}
                  />
                </label>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  Fee: ₹{step.service.fee}
                </div>
              </div>
              
              <button 
                onClick={() => handleApply(step.service.id)}
                className="bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm"
              >
                Apply Online
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Auto-fill Preview Modal */}
      {filledForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-indigo-900 p-6 text-white">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-xl font-bold">Smart Form Preview</h3>
                <button onClick={() => setFilledForm(null)} className="text-indigo-300 hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <p className="text-indigo-200 text-sm">{filledForm.form_name}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex gap-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-xs text-amber-800">We&apos;ve auto-filled this form using data from your uploaded documents. Please review before submitting.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {filledForm.fields.map((field, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{field.label}</label>
                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm font-medium text-slate-700">
                      {field.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 border-t flex justify-end gap-3">
              <button onClick={() => setFilledForm(null)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition">Edit Manually</button>
              <button className="px-6 py-2 text-sm font-bold bg-green-600 text-white hover:bg-green-700 rounded-lg transition shadow-md">Confirm & Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
