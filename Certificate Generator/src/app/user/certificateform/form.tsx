"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import { toast } from '@/hooks/use-toast'
import { Trash2 } from "lucide-react";

interface Observation {
  gas: string;
  before: string;
  after: string;
}

interface CertificateRequest {
  certificateNo: string;
  customerName: string;
  siteLocation: string;
  makeModel: string;
  range: string;
  serialNo: string;
  calibrationGas: string;
  gasCanisterDetails: string;
  dateOfCalibration: string;
  calibrationDueDate: string;
  observations: Observation[];
  engineerId: string;
  engineerName: string;
  status: string;
}

interface CertificateResponse {
  certificateId: string;
  message: string;
  downloadUrl: string;
}

interface Model {
  model_name: string;
  range: string;
}

interface Engineer {
  id: string;
  name: string;
}

interface Company {
  _id: string;
  companyName: string;
}

export default function GenerateCertificate() {
  const [formData, setFormData] = useState<CertificateRequest>({
    certificateNo: "",
    customerName: "",
    siteLocation: "",
    makeModel: "",
    range: "",
    serialNo: "",
    calibrationGas: "",
    gasCanisterDetails: "",
    dateOfCalibration: new Date().toISOString().split('T')[0],
    calibrationDueDate: new Date().toISOString().split('T')[0],
    observations: [{ gas: "", before: "", after: "" }],
    engineerId: "",
    engineerName: "",
    status: "",
  });

  const [certificate, setCertificate] = useState<CertificateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [timePeriod, setTimePeriod] = useState<number | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [isLoadingEngineers, setIsLoadingEngineers] = useState(true);
  const [engineerError, setEngineerError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);

  const fetchCompanies = async () => {
    try {
      setIsLoadingCompanies(true);
      const response = await axios.get(
        `http://localhost:5000/api/v1/company/getAllcompanies`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      setCompanies(response.data.data || response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch companies",
        variant: "destructive",
      });
      console.error("Error fetching companies:", error);
    } finally {
      setIsLoadingCompanies(false);
    }
  };


  useEffect(() => {
    fetchCompanies();

  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/v1/addcategory/getCategories');
        const data = await response.json();
        setModels(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setError("Failed to load models. Using default options.");
      } finally {
        setIsLoadingModels(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchEngineers = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/v1/engineers/getEngineers");
        const data = await response.json();
        setEngineers(data);
      } catch (error) {
        console.error("Error fetching engineers:", error);
        setEngineerError("Failed to load engineers.");
      } finally {
        setIsLoadingEngineers(false);
      }
    };

    fetchEngineers();
  }, []);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    setFormData(prev => ({
        ...prev,
        dateOfCalibration: newStartDate
    }));

    if (timePeriod) {
        const startDateObj = new Date(newStartDate);
        startDateObj.setMonth(startDateObj.getMonth() + timePeriod);
        const newEndDate = startDateObj.toISOString().split("T")[0];
        setEndDate(newEndDate);
        setFormData(prev => ({
            ...prev,
            calibrationDueDate: newEndDate
        }));
    }
  };

  const handleTimePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const period = Number(e.target.value);
    setTimePeriod(period);

    if (startDate) {
        const startDateObj = new Date(startDate);
        startDateObj.setMonth(startDateObj.getMonth() + period);
        const newEndDate = startDateObj.toISOString().split("T")[0];
        setEndDate(newEndDate);
        setFormData(prev => ({
            ...prev,
            calibrationDueDate: newEndDate
        }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    let updatedObservations = formData.observations;
    let updatedRange = formData.range;

    if (name === "makeModel") {
      const selectedModel = models.find(m => m.model_name === value);
      updatedRange = selectedModel ? selectedModel.range : "";

      switch (value) {
        case "GMIleakSurveyor":
          updatedObservations = Array(3).fill({ gas: "", before: "", after: "" });
          break;
        case "GMIGT41Series":
          updatedObservations = Array(4).fill({ gas: "", before: "", after: "" });
          break;
        case "GMIGT44":
          updatedObservations = Array(3).fill({ gas: "", before: "", after: "" });
          break;
        default:
          updatedObservations = [{ gas: "", before: "", after: "" }];
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === "makeModel" && { range: updatedRange, observations: updatedObservations })
    }));
  };

  const handleObservationChange = (index: number, field: keyof Observation, value: string) => {
    const updatedObservations = [...formData.observations];
    updatedObservations[index] = { ...updatedObservations[index], [field]: value };
    setFormData({ ...formData, observations: updatedObservations });
  };

  const addObservation = () => {
    if (formData.observations.length < 5) {
      setFormData({
        ...formData,
        observations: [...formData.observations, { gas: "", before: "", after: "" }]
      });
    }
  };

  const removeObservation = (index: number) => {
    const updatedObservations = [...formData.observations];
    updatedObservations.splice(index, 1);
    setFormData({ ...formData, observations: updatedObservations });
  };

  useEffect(() => {
    const certNo = generateCertificateNumber();
    setFormData(prev => ({ ...prev, certificateNo: certNo }));
  }, []);

  const generateCertificateNumber = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const shortStartYear = String(currentYear).slice(-2);
    const shortEndYear = String(currentYear + 1).slice(-2);
    const yearRange = `${shortStartYear}-${shortEndYear}`;
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `RPS/CER/${yearRange}/${randomNum}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submissionData = {
        ...formData,
        dateOfCalibration: startDate ? new Date(startDate) : null,
        calibrationDueDate: endDate ? new Date(endDate) : null
      };

      const hasEmptyObservations = formData.observations.some(obs =>
        !obs.gas?.trim() || !obs.before?.trim() || !obs.after?.trim()
      );

      const response = await fetch("http://localhost:5000/api/v1/certificates/generateCertificate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate certificate");
      }

      const certificate = await response.json();
      setCertificate(certificate);
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setError(err.message || "Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.companyName.toLowerCase().includes(companySearchTerm.toLowerCase())
  );

  const handleDownload = () => {
    const logo = new Image();
    logo.src = "/img/rps.png"; // Set your logo path here

    logo.onload = () => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const leftMargin = 15;
      const rightMargin = 15;
      const topMargin = 20;
      const bottomMargin = 20;
      const contentWidth = pageWidth - leftMargin - rightMargin;
      let y = topMargin;

      // Set logo dimensions and position
      const logoWidth = 60;
      const logoHeight = 20;
      const logoX = 2;
      const logoY = 10;

      // Add logo to the PDF
      doc.addImage(logo, "PNG", logoX, logoY, logoWidth, logoHeight);

      // Move the cursor below the logo
      y = logoY + logoHeight + 10;

      // Set the title
      doc.setFont("times", "bold").setFontSize(16).setTextColor(0, 51, 102);
      doc.text("CALIBRATION CERTIFICATE", pageWidth / 2, y, { align: "center" });
      y += 10;

      const labelX = leftMargin;
      const labelWidth = 55;
      const valueX = labelX + labelWidth + 2;
      const lineGap = 8;

      // Function to add rows of label-value pairs
      const addRow = (labelText: string, value: string) => {
        doc.setFont("times", "bold").setFontSize(11).setTextColor(0);
        doc.text(labelText, labelX, y);
        doc.setFont("times", "normal").setTextColor(50);
        doc.text(": " + (value || "N/A"), valueX, y);
        y += lineGap;
      };

      // Helper function to format dates
      const formatDate = (inputDateString: string | undefined) => {
        if (!inputDateString) return "N/A";
        const inputDate = new Date(inputDateString);
        if (isNaN(inputDate.getTime())) return "N/A";
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${pad(inputDate.getDate())} - ${pad(inputDate.getMonth() + 1)} - ${inputDate.getFullYear()}`;
      };

      // Add form data rows
      addRow("Certificate No.", formData.certificateNo);
      addRow("Customer Name", formData.customerName);
      addRow("Site Location", formData.siteLocation);
      addRow("Make & Model", formData.makeModel);
      addRow("Range", formData.range);
      addRow("Serial No.", formData.serialNo);
      addRow("Calibration Gas", formData.calibrationGas);
      addRow("Gas Canister Details", formData.gasCanisterDetails);

      y += 5;
      addRow("Date of Calibration", formatDate(formData.dateOfCalibration));
      addRow("Calibration Due Date", formatDate(formData.calibrationDueDate));
      addRow("Status", formData.status);

      y += 5;
      // Draw a line separator
      doc.setDrawColor(180);
      doc.setLineWidth(0.3);
      doc.line(leftMargin, y, pageWidth - rightMargin, y);
      y += 10;

      // Set "Observations" section title
      doc.setFont("times", "bold").setFontSize(12).setTextColor(0, 51, 102);
      doc.text("OBSERVATIONS", leftMargin, y);
      y += 10;

      // Table headers and column widths
      const colWidths = [20, 70, 40, 40];
      const headers = ["Sr. No.", "Concentration of Gas", "Reading Before", "Reading After"];
      let x = leftMargin;

      // Draw table headers
      doc.setFont("times", "bold").setFontSize(10).setTextColor(0);
      headers.forEach((header, i) => {
        doc.rect(x, y - 5, colWidths[i], 8);
        doc.text(header, x + 2, y);
        x += colWidths[i];
      });
      y += 8;

      // Add observations data to the table
      doc.setFont("times", "normal").setFontSize(10);
      formData.observations.forEach((obs, index) => {
        let x = leftMargin;
        const rowY = y + index * 8;

        const rowData = [
          `${index + 1}`,
          obs.gas || "",
          obs.before || "",
          obs.after || ""
        ];

        rowData.forEach((text, colIndex) => {
          doc.rect(x, rowY - 6, colWidths[colIndex], 8);
          doc.text(text, x + 2, rowY);
          x += colWidths[colIndex];
        });
      });

      // Move y to the end of the observations table
      y += formData.observations.length * 8 + 15;

      // Conclusion text
      const conclusion = "The above-mentioned Gas Detector was calibrated successfully, and the result confirms that the performance of the instrument is within acceptable limits.";
      doc.setFont("times", "normal").setFontSize(10).setTextColor(0);
      const conclusionLines = doc.splitTextToSize(conclusion, contentWidth);
      doc.text(conclusionLines, leftMargin, y);
      y += conclusionLines.length * 6 + 15;

      // Tested and Calibrated By section
      doc.setFont("times", "bold");
      doc.text("Tested & Calibrated By", pageWidth - rightMargin, y, { align: "right" });
      doc.setFont("times", "normal");
      doc.text(formData.engineerName || "________________", pageWidth - rightMargin, y + 10, { align: "right" });

      // Draw a line separator at the bottom
      doc.setDrawColor(180);
      doc.line(leftMargin, pageHeight - bottomMargin - 10, pageWidth - rightMargin, pageHeight - bottomMargin - 10);

      // Footer text
      doc.setFontSize(8).setTextColor(100);
      doc.text("This certificate is electronically generated and does not require a physical signature.", leftMargin, pageHeight - bottomMargin - 5);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, leftMargin, pageHeight - bottomMargin);

      // Save the PDF
      doc.save("calibration-certificate.pdf");
    };

    // Handle error when the logo fails to load
    logo.onerror = () => {
      console.error("Failed to load logo image.");
      alert("Logo image not found. Please check the path.");
    };
  };


  return (
    <div>
      {/* <h1 className="text-2xl font-bold mb-4">Generate Your Certificate</h1> */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="relative w-full">
            <input
              type="text"
              name="customerName"
              placeholder="Customer Name"
              value={formData.customerName}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, customerName: e.target.value }));
                setCompanySearchTerm(e.target.value);
                setShowCompanyDropdown(true);
              }}
              onFocus={() => setShowCompanyDropdown(true)}
              onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 150)}
              className="w-full bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
            />

            {showCompanyDropdown && (
              <ul className="absolute left-0 top-full mt-1 z-20 w-full rounded-md border bg-white text-sm shadow-lg max-h-60 overflow-y-auto">
                {isLoadingCompanies ? (
                  <li className="px-4 py-2 text-gray-500">Loading companies...</li>
                ) : filteredCompanies.length > 0 ? (
                  filteredCompanies.map((company) => (
                    <li
                      key={company._id}
                      className={`px-4 py-2 cursor-pointer transition-colors ${selectedCompanyName === company.companyName ? "font-medium" : ""}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, customerName: company.companyName }));
                        setCompanySearchTerm(company.companyName);
                        setSelectedCompanyName(company.companyName);
                        setShowCompanyDropdown(false);
                      }}
                    >
                      {company.companyName}
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-gray-500">
                    {companySearchTerm ? "No companies found" : "Start typing to search companies"}
                  </li>
                )}
              </ul>
            )}
          </div>

          <input
            type="text"
            name="siteLocation"
            placeholder="Enter Site Location"
            value={formData.siteLocation}
            onChange={handleChange}
            className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <select
            name="makeModel"
            value={formData.makeModel}
            onChange={handleChange}
            required
            disabled={isLoadingModels}
            className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
          >
            <option value="">Select Make and Model</option>
            {isLoadingModels ? (
              <option value="" disabled>Loading models...</option>
            ) : models.length > 0 ? (
              models.map((model) => (
                <option key={model.model_name} value={model.model_name}>
                  {model.model_name}
                </option>
              ))
            ) : (
              <>
                <option value="GMIleakSurveyor">GMI leak Surveyor</option>
                <option value="GMIGT41Series">GMI GT 41 Series</option>
                <option value="GMIGT44">GMI GT 44</option>
              </>
            )}
          </select>

          <input
            type="text"
            name="range"
            placeholder="Range"
            value={formData.range}
            onChange={handleChange}
            disabled
            className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <input
            type="text"
            name="serialNo"
            placeholder="Enter Serial Number"
            value={formData.serialNo}
            onChange={handleChange}
            className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
          />
          <input
            type="text"
            name="calibrationGas"
            placeholder="Enter Calibration Gas"
            value={formData.calibrationGas}
            onChange={handleChange}
            className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-1">
          <textarea
            name="gasCanisterDetails"
            placeholder="Enter Gas Canister Details"
            value={formData.gasCanisterDetails}
            onChange={handleChange}
            className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <input
            type="date"
            name="dateOfCalibration"
            value={startDate}
            onChange={handleStartDateChange}
            className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
          />
          <select
            onChange={handleTimePeriodChange}
            className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
          >
            <option value="">Select Period</option>
            <option value="3">3 Months</option>
            <option value="6">6 Months</option>
            <option value="9">9 Months</option>
            <option value="12">12 Months</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <input
            type="date"
            name="calibrationDueDate"
            placeholder="Enter Calibration Due Date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setFormData(prev => ({
                  ...prev,
                  calibrationDueDate: e.target.value
              }));
          }}
            disabled={timePeriod !== null}
            min="2000-01-01"
            max="2100-12-31"
            className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
          />
          <select
            name="engineerName"
            value={formData.engineerName}
            onChange={handleChange}
            required
            disabled={isLoadingEngineers}
            className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
          >
            <option value="">Select Engineer Name</option>
            {isLoadingEngineers ? (
              <option>Loading engineers...</option>
            ) : engineerError ? (
              <option>Error loading engineers</option>
            ) : (
              engineers.map((engineer, index) => (
                <option key={engineer.id || index} value={engineer.name}>
                  {engineer.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <input
            type="text"
            name="certificateNo"
            placeholder="Certificate No."
            value={formData.certificateNo}
            onChange={handleChange}
            readOnly
            className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
          />
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
          >
            <option value="">Select Status</option>
            <option value="Checked">Checked</option>
            <option value="Unchecked">Unchecked</option>
          </select>
        </div>

        <h2 className="text-lg font-bold mt-4">Observation Table</h2>
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={addObservation}
            className="bg-purple-950 text-white px-4 py-2 border rounded hover:bg-gray-900"
            disabled={formData.observations.length >= 5}
          >
            Create Observation
          </button>
        </div>

        <table className="table-auto border-collapse border border-gray-500 rounded w-full">
          <thead>
            <tr>
              <th className="border p-2">#</th>
              <th className="border p-2">Gas</th>
              <th className="border p-2">Before Calibration</th>
              <th className="border p-2">After Calibration</th>
              <th className="border p-2">Remove</th>
            </tr>
          </thead>
          <tbody>
            {formData.observations.map((observation, index) => (
              <tr key={index}>
                <td className="border p-2">{index + 1}</td>
                <td className="border p-2">
                  <input
                    type="text"
                    name="gas"
                    value={observation.gas}
                    onChange={(e) => handleObservationChange(index, 'gas', e.target.value)}
                    className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-1 rounded-md w-full"
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="text"
                    name="before"
                    value={observation.before}
                    onChange={(e) => handleObservationChange(index, 'before', e.target.value)}
                    className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-1 rounded-md w-full"
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="text"
                    name="after"
                    value={observation.after}
                    onChange={(e) => handleObservationChange(index, 'after', e.target.value)}
                    className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-1 rounded-md w-full"
                  />
                </td>
                <td className="border p-2">
                  <button type="button" onClick={() => removeObservation(index)}>
                    <Trash2 className="h-6 w-6" />
                  </button>
                </td>
              </tr>
            ))}
            {formData.observations.length === 0 && (
              <tr>
                <td colSpan={5} className="border p-2 text-center text-gray-500">
                  No observations added yet. Click "Add Observation" to add one.
                </td>
              </tr>
            )}
            {formData.observations.length >= 5 && (
              <tr>
                <td colSpan={5} className="border p-2 text-center text-yellow-600">
                  Maximum limit of 5 observations reached.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <button
          type="submit"
          className="bg-blue-950 hover:bg-blue-900 text-white p-2 rounded-md"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Certificate"}
        </button>
      </form>


      {error && <p className="text-red-500 mt-4">{error}</p>}

      {certificate && (
        <div className="mt-4 text-center">
          <p className="text-green-600 mb-2">{certificate.message}</p>
          <Button
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 flex items-center justify-center gap-2 mx-auto"
            onClick={handleDownload}
            disabled={loading}
          >
            {loading ? "Downloading..." : "Download Certificate"}
          </Button>
        </div>
      )}
    </div>
  );
}
