# Import Instructions

## Files Available:
- `CSE.xlsx` - Computer Science Engineering lab assets
- `DSE.docx` - Data Science Engineering lab assets  
- `ICT.docx` - Information and Communication Technology lab assets

## Import Commands:

### Import CSE Excel file:
```bash
npm run import:cse
```
Or with custom path:
```bash
npm run import:cse data/CSE.xlsx
```

### Import DSE Word document:
```bash
npm run import:dse
```
Or with custom path:
```bash
npm run import:dse data/DSE.docx
```

### Import ICT Word document:
```bash
npm run import:ict
```
Or with custom path:
```bash
npm run import:ict data/ICT.docx
```

## Import All Files:
```bash
npm run import:cse
npm run import:dse
npm run import:ict
```

## Notes:
- Make sure MongoDB is running before importing
- The scripts will create labs and assets automatically
- Lab codes will be normalized (spaces removed, uppercase)
- Assets will be linked to their respective labs
- Duplicate labs/assets will be updated (upsert) rather than creating duplicates

