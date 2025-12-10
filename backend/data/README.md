# Data Files Directory

Place your Excel (.xlsx) and DOC (.doc, .docx) files here for import.

## File Structure Expected:

### Excel File Format:
- Sheet name: "Labs"
  - Columns: Code, Name, Department, Location (optional), Remarks (optional)
  
- Sheet name: "Assets"
  - Columns: Asset Tag, Lab Code, Status, Model Name, Manufacturer, Serial Number, Purchase Date, Warranty Expiry, Remarks (optional)

### DOC File Format:
The DOC parser will attempt to extract lab and asset information. The format should include:
- Lab information with: Lab Code, Name, Department
- Asset information with: Asset Tag, Lab Code, Status

## Import Commands:

After placing files here, you can import them using:

```bash
# Import Excel file
npm run import:excel data/your-file.xlsx

# Import DOC file
npm run import:doc data/your-file.doc
```

