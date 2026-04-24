import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  User as UserIcon, 
  AlertCircle,
  TrendingUp,
  Activity,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { User, CheckIn } from '../types';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import { analyzeRisk } from '../services/gemini';
import { cn } from '../lib/utils';

interface ClinicianReportProps {
  user: User;
  checkIns: CheckIn[];
}

export default function ClinicianReport({ user, checkIns }: ClinicianReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const generateAiSummary = async () => {
    setIsGenerating(true);
    try {
      const summary = await analyzeRisk(checkIns.slice(0, 10));
      setAiSummary(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(20, 20, 20);
    doc.text('MindBridge Clinician Report', margin, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${format(new Date(), 'MMMM do, yyyy')}`, margin, y);
    y += 15;

    // Patient Info
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Patient Information', margin, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`Name: ${user.name}`, margin, y); y += 6;
    doc.text(`Preferred Name: ${user.preferred_name}`, margin, y); y += 6;
    doc.text(`Age Range: ${user.age_range}`, margin, y); y += 6;
    doc.text(`Appointment Date: ${user.appointment_date}`, margin, y); y += 15;

    // Reason for Care
    doc.setFontSize(14);
    doc.text('Reason for Care', margin, y);
    y += 8;
    doc.setFontSize(11);
    const splitReason = doc.splitTextToSize(user.care_reason || 'No reason provided.', 170);
    doc.text(splitReason, margin, y);
    y += (splitReason.length * 6) + 10;

    // AI Summary
    if (aiSummary) {
      doc.setFillColor(245, 248, 245);
      doc.rect(margin - 2, y - 5, 174, (doc.splitTextToSize(aiSummary.summary, 170).length * 6) + 20, 'F');
      
      doc.setFontSize(14);
      doc.setTextColor(40, 80, 40);
      doc.text('AI Clinical Summary', margin, y);
      y += 8;
      doc.setFontSize(11);
      doc.text(`Risk Level: ${aiSummary.riskLevel}`, margin, y); y += 6;
      const splitSummary = doc.splitTextToSize(aiSummary.summary, 170);
      doc.text(splitSummary, margin, y);
      y += (splitSummary.length * 6) + 15;
      doc.setTextColor(0);
    }

    // Mood Trend Graph (Simple Drawing)
    doc.setFontSize(14);
    doc.text('Mood Trend (Last 7 Days)', margin, y);
    y += 10;

    const chartWidth = 160;
    const chartHeight = 40;
    const chartX = margin;
    const chartY = y;

    // Draw Axes
    doc.setDrawColor(200);
    doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight); // X axis
    doc.line(chartX, chartY, chartX, chartY + chartHeight); // Y axis

    // Plot Data
    const recentCheckIns = [...checkIns].reverse().slice(-7);
    if (recentCheckIns.length > 1) {
      doc.setDrawColor(74, 124, 89);
      doc.setLineWidth(0.8);
      
      const stepX = chartWidth / (recentCheckIns.length - 1);
      recentCheckIns.forEach((c, i) => {
        const x = chartX + (i * stepX);
        const yVal = chartY + chartHeight - (c.mood / 10 * chartHeight);
        
        if (i > 0) {
          const prevX = chartX + ((i - 1) * stepX);
          const prevYVal = chartY + chartHeight - (recentCheckIns[i-1].mood / 10 * chartHeight);
          doc.line(prevX, prevYVal, x, yVal);
        }
        
        doc.setFillColor(74, 124, 89);
        doc.circle(x, yVal, 1, 'F');
        
        // Date labels
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(format(new Date(c.created_at!), 'MM/dd'), x - 4, chartY + chartHeight + 5);
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text('Insufficient data for trend graph.', chartX + 10, chartY + 20);
    }
    
    y += chartHeight + 20;
    doc.setTextColor(0);

    // Recent History Table
    doc.setFontSize(14);
    doc.text('Recent Symptom History', margin, y);
    y += 8;
    checkIns.slice(0, 5).forEach(c => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.text(`${format(new Date(c.created_at!), 'MMM d')}: Mood ${c.mood}, Anxiety ${c.anxiety}, Stress ${c.stress}`, margin, y);
      y += 6;
    });

    return doc;
  };

  const exportPDF = () => {
    const doc = generatePDF();
    doc.save(`MindBridge_Report_${user.name.replace(/\s+/g, '_')}.pdf`);
  };

  const previewPDF = () => {
    const doc = generatePDF();
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Clinician Report</h2>
        <p className="text-stone-500 mt-1">A structured summary to help your doctor understand your experience.</p>
      </section>

      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-stone-900">Report Preview</h3>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={previewPDF}
                className="bg-stone-100 text-stone-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-stone-200 transition-colors"
              >
                <Activity className="w-4 h-4" />
                Preview PDF
              </button>
              <button 
                onClick={exportPDF}
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
          
          {pdfUrl && (
            <div className="mb-6 h-[500px] border border-stone-200 rounded-2xl overflow-hidden bg-stone-100">
              <iframe src={pdfUrl} className="w-full h-full" title="PDF Preview" />
            </div>
          )}
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Patient</p>
                <p className="text-sm font-bold text-stone-900">{user.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Appt Date</p>
                <p className="text-sm font-bold text-stone-900">{user.appointment_date}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* AI Summary Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest">AI Clinical Insights</h4>
              {!aiSummary && (
                <button 
                  onClick={generateAiSummary}
                  disabled={isGenerating}
                  className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 hover:underline disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
                  Generate Summary
                </button>
              )}
            </div>
            
            {aiSummary ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                    aiSummary.riskLevel === 'LOW' ? "bg-emerald-200 text-emerald-700" :
                    aiSummary.riskLevel === 'MODERATE' ? "bg-amber-200 text-amber-700" :
                    "bg-rose-200 text-rose-700"
                  )}>
                    {aiSummary.riskLevel} RISK
                  </span>
                </div>
                <p className="text-sm text-stone-700 leading-relaxed">{aiSummary.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {aiSummary.flags.map((flag: string, i: number) => (
                    <span key={i} className="bg-white/50 border border-emerald-200 px-2 py-1 rounded-lg text-[10px] font-medium text-emerald-700">
                      • {flag}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-stone-50 border border-dashed border-stone-200 rounded-2xl p-8 text-center">
                <p className="text-xs text-stone-400">Click generate to create an AI-powered summary for your clinician.</p>
              </div>
            )}
          </section>

          {/* Symptom Timeline */}
          <section>
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Symptom Timeline</h4>
            <div className="space-y-3">
              {checkIns.slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-center gap-4 p-3 border border-stone-100 rounded-xl">
                  <div className="text-xs font-bold text-stone-400 w-12">
                    {format(new Date(c.created_at!), 'MMM d')}
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div className="text-[10px] text-stone-500">Mood: <span className="font-bold text-stone-900">{c.mood}</span></div>
                    <div className="text-[10px] text-stone-500">Anxiety: <span className="font-bold text-stone-900">{c.anxiety}</span></div>
                    <div className="text-[10px] text-stone-500">Stress: <span className="font-bold text-stone-900">{c.stress}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex gap-4">
        <AlertCircle className="w-6 h-6 text-blue-600 shrink-0" />
        <div>
          <h4 className="font-bold text-blue-900 text-sm mb-1">How to use this report</h4>
          <p className="text-xs text-blue-800 leading-relaxed">
            You can print this report or show it to your clinician on your phone during your first appointment. It helps them get a clear picture of your symptoms over time.
          </p>
        </div>
      </div>
    </div>
  );
}
