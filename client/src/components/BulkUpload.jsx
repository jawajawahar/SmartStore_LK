import { useState } from "react";
import Papa from "papaparse";
import { FaCloudUploadAlt, FaDownload, FaExclamationTriangle, FaCheckCircle, FaSpinner } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import API from "../services/api";
import { toast } from "react-toastify";

const BulkUpload = ({ isOpen, onClose, type, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  // Configurations per upload type
  const config = {
    products: {
      title: "Bulk Products Import",
      templateHeaders: ["name", "category", "buyingPrice", "sellingPrice", "bulkPrice", "stock", "barcode", "unit", "productType"],
      templateData: [
        ["Sample Product A", "Groceries", "100", "120", "115", "50", "8801234567890", "pcs", "fixed"],
        ["Sample Product B", "Beverages", "250", "300", "", "100", "8809876543210", "pcs", "fixed"]
      ],
      validate: (row, index) => {
        const rowErrors = [];
        if (!row.name?.trim()) rowErrors.push("Product name is required");
        if (isNaN(Number(row.buyingPrice)) || Number(row.buyingPrice) <= 0) rowErrors.push("Buying price must be a valid positive number");
        if (isNaN(Number(row.sellingPrice)) || Number(row.sellingPrice) <= 0) rowErrors.push("Selling price must be a valid positive number");
        if (isNaN(Number(row.stock)) || Number(row.stock) < 0) rowErrors.push("Stock must be a non-negative number");
        return rowErrors;
      },
      endpoint: "/products/bulk",
      payloadKey: "products",
    },
    customers: {
      title: "Bulk Customers Import",
      templateHeaders: ["name", "phone", "address", "customerType"],
      templateData: [
        ["Jane Doe", "0771234567", "123 Galle Rd, Colombo", "normal"],
        ["Retailer Shop", "0719876543", "456 Kandy Rd, Kadawatha", "bulk"]
      ],
      validate: (row, index) => {
        const rowErrors = [];
        if (!row.name?.trim()) rowErrors.push("Customer name is required");
        if (!row.phone?.trim()) rowErrors.push("Phone number is required");
        return rowErrors;
      },
      endpoint: "/customers/bulk",
      payloadKey: "customers",
    },
    suppliers: {
      title: "Bulk Suppliers Import",
      templateHeaders: ["name", "company", "phone", "address", "payableAmount"],
      templateData: [
        ["Distributor X", "Agro Foods PLC", "0112345678", "789 Negombo Rd, Ja-Ela", "0"],
        ["Wholesaler Y", "Lanka Beverages", "0339876543", "12 Line St, Gampaha", "1500"]
      ],
      validate: (row, index) => {
        const rowErrors = [];
        if (!row.name?.trim()) rowErrors.push("Supplier name is required");
        if (!row.phone?.trim()) rowErrors.push("Phone number is required");
        if (row.payableAmount !== undefined && row.payableAmount !== "" && isNaN(Number(row.payableAmount))) {
          rowErrors.push("Payable amount must be a valid number");
        }
        return rowErrors;
      },
      endpoint: "/suppliers/bulk",
      payloadKey: "suppliers",
    }
  }[type];

  // Helper to download template CSV
  const downloadTemplate = () => {
    const csvContent = Papa.unparse({
      fields: config.templateHeaders,
      data: config.templateData
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `smartstore_${type}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle local CSV file selection and parsing
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (results) => {
        const parsed = results.data;
        
        // Normalize CSV header keys case-insensitively and handle spaces/underscores
        const normalizedData = parsed.map((row) => {
          const normalizedRow = {};
          
          const findVal = (possibleKeys) => {
            const matchedKey = Object.keys(row).find(k => 
              possibleKeys.includes(k.trim().toLowerCase().replace(/[\s_-]/g, ""))
            );
            return matchedKey ? row[matchedKey] : undefined;
          };

          if (type === "products") {
            normalizedRow.name = findVal(["name", "productname", "title"]);
            normalizedRow.category = findVal(["category", "cat"]);
            normalizedRow.buyingPrice = findVal(["buyingprice", "buyprice", "costprice", "cost"]);
            normalizedRow.sellingPrice = findVal(["sellingprice", "sellprice", "price"]);
            normalizedRow.bulkPrice = findVal(["bulkprice", "wholesale", "wholesaleprice"]);
            normalizedRow.stock = findVal(["stock", "qty", "quantity", "initialstock"]);
            normalizedRow.barcode = findVal(["barcode", "code", "sku"]);
            normalizedRow.unit = findVal(["unit", "measure"]);
            normalizedRow.productType = findVal(["producttype", "type"]);
          } else if (type === "customers") {
            normalizedRow.name = findVal(["name", "customername"]);
            normalizedRow.phone = findVal(["phone", "phonenumber", "contact", "mobile"]);
            normalizedRow.address = findVal(["address", "location"]);
            normalizedRow.customerType = findVal(["customertype", "type"]);
          } else if (type === "suppliers") {
            normalizedRow.name = findVal(["name", "suppliername"]);
            normalizedRow.company = findVal(["company", "companyname", "vendor"]);
            normalizedRow.phone = findVal(["phone", "phonenumber", "contact", "mobile"]);
            normalizedRow.address = findVal(["address", "location"]);
            normalizedRow.payableAmount = findVal(["payableamount", "balance", "outstanding", "due"]);
          }

          // Fallback check to copy over exact case matches
          config.templateHeaders.forEach(header => {
            if (normalizedRow[header] === undefined) {
              const exactKey = Object.keys(row).find(k => k.trim().toLowerCase() === header.toLowerCase());
              if (exactKey) {
                normalizedRow[header] = row[exactKey];
              }
            }
          });

          return normalizedRow;
        });

        const validationErrors = [];
        normalizedData.forEach((row, index) => {
          const rowErrors = config.validate(row, index);
          if (rowErrors.length > 0) {
            validationErrors.push({ rowNumber: index + 1, name: row.name || `Row ${index + 1}`, issues: rowErrors });
          }
        });

        setParsedData(normalizedData);
        setErrors(validationErrors);
        setStep(3); // Advance to preview
      },
      error: (error) => {
        toast.error("Error parsing CSV file: " + error.message);
      }
    });
  };

  // Submit parsed data to backend
  const handleSubmit = async () => {
    setLoading(true);
    setStep(4);
    try {
      const token = localStorage.getItem("token");
      const response = await API.post(config.endpoint, {
        [config.payloadKey]: parsedData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setResult({
        success: true,
        inserted: response.data.inserted || parsedData.length - (response.data.errors?.length || 0),
        errors: response.data.errors || [],
      });
      toast.success(response.data.message || "Bulk import completed!");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      setResult({
        success: false,
        message: error.response?.data?.message || "Import failed. Please try again.",
      });
      toast.error("Bulk upload import failed");
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setStep(1);
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border-color bg-bg-card shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-color bg-bg-main/50">
          <div>
            <h3 className="text-xl font-bold text-text-main">{config.title}</h3>
            <p className="text-sm text-text-secondary">Follow the steps to bulk upload data via CSV</p>
          </div>
          <button
            onClick={() => { resetState(); onClose(); }}
            className="p-2 rounded-lg text-text-secondary hover:bg-bg-main hover:text-text-main transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Steps Progress Bar */}
        <div className="flex justify-between items-center px-8 py-4 bg-bg-main/20 border-b border-border-color text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 flex items-center justify-center rounded-full font-bold ${step >= 1 ? "bg-blue-600 text-white" : "bg-bg-main text-text-secondary"}`}>1</span>
            <span className={step >= 1 ? "text-text-main font-semibold" : "text-text-secondary"}>Template</span>
          </div>
          <div className="w-12 h-[2px] bg-border-color"></div>
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 flex items-center justify-center rounded-full font-bold ${step >= 2 ? "bg-blue-600 text-white" : "bg-bg-main text-text-secondary"}`}>2</span>
            <span className={step >= 2 ? "text-text-main font-semibold" : "text-text-secondary"}>Upload</span>
          </div>
          <div className="w-12 h-[2px] bg-border-color"></div>
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 flex items-center justify-center rounded-full font-bold ${step >= 3 ? "bg-blue-600 text-white" : "bg-bg-main text-text-secondary"}`}>3</span>
            <span className={step >= 3 ? "text-text-main font-semibold" : "text-text-secondary"}>Validate</span>
          </div>
          <div className="w-12 h-[2px] bg-border-color"></div>
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 flex items-center justify-center rounded-full font-bold ${step >= 4 ? "bg-blue-600 text-white" : "bg-bg-main text-text-secondary"}`}>4</span>
            <span className={step >= 4 ? "text-text-main font-semibold" : "text-text-secondary"}>Result</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto min-h-[300px]">
          {step === 1 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 mb-4">
                <FaDownload className="text-2xl" />
              </div>
              <h4 className="text-lg font-semibold text-text-main mb-2">Download Sample Template</h4>
              <p className="text-sm text-text-secondary max-w-md mb-6">
                Before uploading, download our formatted CSV template. Keep the headers exactly as they are to ensure compatibility.
              </p>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all"
              >
                <FaDownload /> Download CSV Template
              </button>
              <button
                onClick={() => setStep(2)}
                className="mt-4 text-sm text-blue-500 hover:underline"
              >
                Already have the file? Proceed to upload
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center justify-center py-6">
              <label className="w-full max-w-lg flex flex-col items-center justify-center h-48 border-2 border-dashed border-border-color rounded-2xl cursor-pointer hover:border-blue-500/50 hover:bg-bg-main/30 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FaCloudUploadAlt className="text-4xl text-text-secondary mb-3" />
                  <p className="mb-2 text-sm text-text-main font-semibold">Click to upload or drag and drop</p>
                  <p className="text-xs text-text-secondary">CSV files only (up to 5MB)</p>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              <button
                onClick={() => setStep(1)}
                className="mt-6 text-sm text-text-secondary hover:text-text-main"
              >
                Back to step 1
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-text-main">Data Preview & Validation</h4>
                  <p className="text-xs text-text-secondary">Parsed {parsedData.length} records from "{file?.name}"</p>
                </div>
                {errors.length > 0 ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-xs font-semibold">
                    <FaExclamationTriangle /> {errors.length} validation issue(s) detected
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-xs font-semibold">
                    <FaCheckCircle /> All records valid
                  </div>
                )}
              </div>

              {/* Validation Errors Panel */}
              {errors.length > 0 && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                  <h5 className="text-sm font-bold text-red-500 mb-2">Errors found:</h5>
                  <div className="max-h-32 overflow-y-auto text-xs flex flex-col gap-1 text-text-secondary">
                    {errors.map((err, i) => (
                      <div key={i}>
                        <strong className="text-text-main">Row {err.rowNumber} ({err.name}):</strong> {err.issues.join(", ")}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Table */}
              <div className="overflow-x-auto border border-border-color rounded-xl max-h-60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-bg-main border-b border-border-color sticky top-0">
                    <tr>
                      <th className="p-3 font-semibold text-text-secondary w-12 text-center">Row</th>
                      {config.templateHeaders.map((h) => (
                        <th key={h} className="p-3 font-semibold text-text-secondary capitalize">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((row, rIdx) => {
                      const isInvalid = errors.some((e) => e.rowNumber === rIdx + 1);
                      return (
                        <tr
                          key={rIdx}
                          className={`border-b border-border-color/50 transition-colors ${isInvalid ? "bg-red-500/5 hover:bg-red-500/10 text-red-600/90 dark:text-red-400" : "hover:bg-bg-main/30"}`}
                        >
                          <td className="p-3 text-center text-text-secondary font-medium">{rIdx + 1}</td>
                          {config.templateHeaders.map((col) => (
                            <td key={col} className="p-3 whitespace-nowrap">{row[col] || "-"}</td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 10 && (
                <p className="text-center text-xs text-text-secondary italic">Showing first 10 rows of {parsedData.length} total rows.</p>
              )}

              <div className="flex justify-between items-center mt-4 border-t border-border-color pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-border-color hover:bg-bg-main text-text-main rounded-xl transition-all"
                >
                  Re-upload File
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={errors.length > 0}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
                >
                  Import {parsedData.length} Records
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center justify-center py-12">
              {loading ? (
                <div className="text-center">
                  <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
                  <h4 className="font-semibold text-text-main mb-1">Importing data...</h4>
                  <p className="text-sm text-text-secondary">Saving valid records to the database</p>
                </div>
              ) : result ? (
                <div className="w-full max-w-md text-center">
                  {result.success ? (
                    <>
                      <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-green-500/10 text-green-500 mx-auto mb-4">
                        <FaCheckCircle className="text-4xl" />
                      </div>
                      <h4 className="text-xl font-bold text-text-main mb-2">Import Successful!</h4>
                      <p className="text-sm text-text-secondary mb-6">
                        Successfully imported <span className="font-bold text-text-main">{result.inserted}</span> records.
                      </p>

                      {result.errors.length > 0 && (
                        <div className="mb-6 p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-left max-h-40 overflow-y-auto text-xs">
                          <h5 className="font-bold text-red-500 mb-2">Failed rows:</h5>
                          {result.errors.map((err, i) => (
                            <div key={i} className="mb-1 text-text-secondary">
                              <strong>Row {err.row}:</strong> {err.missing?.join(", ")} missing
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-red-500/10 text-red-500 mx-auto mb-4">
                        <FaExclamationTriangle className="text-4xl" />
                      </div>
                      <h4 className="text-xl font-bold text-text-main mb-2">Import Failed</h4>
                      <p className="text-sm text-text-secondary mb-6">{result.message}</p>
                    </>
                  )}

                  <button
                    onClick={() => { resetState(); onClose(); }}
                    className="px-6 py-2.5 bg-text-main text-bg-main hover:opacity-90 rounded-xl transition-all w-full font-semibold"
                  >
                    Close Modal
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BulkUpload;
