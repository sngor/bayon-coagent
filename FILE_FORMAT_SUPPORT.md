# File Format Support for Knowledge Base

## Supported Formats

### ✅ Fully Supported (Production Ready)

#### 1. **Plain Text Files**

- **Formats**: `.txt`, `.md`, `.markdown`
- **Processing**: Direct text extraction
- **Speed**: Instant
- **Use Cases**: Notes, documentation, reports

#### 2. **CSV Files** 🆕

- **Format**: `.csv`
- **Processing**: Parsed into readable format
- **Features**:
  - Extracts column headers
  - Formats rows as key-value pairs
  - Includes first 100 rows (configurable)
  - Shows total row count
- **Speed**: Instant
- **Use Cases**: Property data, market statistics, client lists, pricing tables

**Example CSV Output:**

```
CSV Data with 150 rows:

Columns: Address, Price, Bedrooms, Bathrooms, Square Feet

Row 1:
  Address: 123 Main St
  Price: $450,000
  Bedrooms: 3
  Bathrooms: 2
  Square Feet: 1,800

... and 50 more rows
```

#### 3. **JSON Files**

- **Format**: `.json`
- **Processing**: Formatted with indentation
- **Speed**: Instant
- **Use Cases**: API data, structured data, configuration files

#### 4. **HTML Files**

- **Formats**: `.html`, `.htm`
- **Processing**:
  - Removes scripts and styles
  - Strips HTML tags
  - Converts entities (&nbsp;, &amp;, etc.)
  - Normalizes whitespace
- **Speed**: Instant
- **Use Cases**: Web pages, email templates, saved articles

#### 5. **PDF Files** 🆕

- **Format**: `.pdf`
- **Processing**: Basic text extraction
- **Limitations**:
  - Works for text-based PDFs
  - Does NOT work for scanned images
  - May miss complex formatting
- **Speed**: Fast
- **Use Cases**: Reports, contracts, presentations (text-based)

**Note**: For production-grade PDF extraction (including scanned documents), set up a Lambda function with `pdf-parse` library.

### ⚠️ Partially Supported (Manual Conversion Recommended)

#### 6. **Word Documents**

- **Formats**: `.docx`, `.doc`
- **Current Status**: Not automatically processed
- **Workaround**: Convert to TXT or PDF before uploading
- **Future**: Lambda function with `mammoth` library

#### 7. **Excel Spreadsheets**

- **Formats**: `.xlsx`, `.xls`
- **Current Status**: Not automatically processed
- **Workaround**: Export to CSV before uploading
- **Future**: Lambda function with `xlsx` library

## File Size Limits

- **Maximum file size**: 10MB per file
- **Recommended**: Keep files under 5MB for faster processing
- **Large files**: Split into smaller chunks or summarize before uploading

## Processing Pipeline

```
Upload File
    ↓
Store in S3
    ↓
Extract Text (based on file type)
    ↓
Chunk Text (500 chars, 50 char overlap)
    ↓
Generate Embeddings (Bedrock Titan)
    ↓
Store in DynamoDB
    ↓
Status: Indexed ✅
```

## CSV File Examples

### Property Listings CSV

```csv
Address,Price,Bedrooms,Bathrooms,SquareFeet,YearBuilt
123 Main St,$450000,3,2,1800,2005
456 Oak Ave,$525000,4,2.5,2200,2010
789 Pine Rd,$395000,2,2,1500,2000
```

**Extracted Text:**

```
CSV Data with 3 rows:

Columns: Address, Price, Bedrooms, Bathrooms, SquareFeet, YearBuilt

Row 1:
  Address: 123 Main St
  Price: $450000
  Bedrooms: 3
  Bathrooms: 2
  SquareFeet: 1800
  YearBuilt: 2005

Row 2:
  Address: 456 Oak Ave
  Price: $525000
  Bedrooms: 4
  Bathrooms: 2.5
  SquareFeet: 2200
  YearBuilt: 2010

Row 3:
  Address: 789 Pine Rd
  Price: $395000
  Bedrooms: 2
  Bathrooms: 2
  SquareFeet: 1500
  YearBuilt: 2000
```

### Market Statistics CSV

```csv
Month,MedianPrice,DaysOnMarket,InventoryCount
Jan 2024,$485000,28,450
Feb 2024,$492000,25,425
Mar 2024,$505000,22,400
```

**Use in Chat:**

```
User: "What were the market trends in Q1 2024?"

AI: "Based on your market statistics, Q1 2024 showed strong growth:
- Median prices increased from $485K (Jan) to $505K (Mar)
- Days on market decreased from 28 to 22 days
- Inventory tightened from 450 to 400 homes
This indicates a seller's market with increasing demand."
```

## PDF File Examples

### Text-Based PDF ✅

- **Works**: Reports, contracts, typed documents
- **Example**: Market analysis report, property disclosure
- **Extraction**: Good quality

### Scanned PDF ❌

- **Doesn't Work**: Scanned images, photos of documents
- **Example**: Scanned contracts, photographed pages
- **Workaround**: Use OCR tool first, or set up Lambda with pdf-parse

## Best Practices

### 1. File Naming

- Use descriptive names: `seattle-market-report-q4-2024.pdf`
- Avoid special characters: Use hyphens instead of spaces
- Include dates: Helps with organization and retrieval

### 2. File Organization

- **Market Data**: `market-stats-seattle-2024.csv`
- **Client Info**: `client-notes-smith-family.txt`
- **Property Data**: `property-analysis-123-main-st.pdf`
- **Research**: `neighborhood-guide-capitol-hill.md`

### 3. Content Quality

- **Clear text**: Avoid handwritten notes or poor scans
- **Structured data**: Use CSV for tabular data
- **Readable format**: Plain text is always best
- **Relevant content**: Upload only what you'll reference

### 4. File Size Optimization

- **Compress PDFs**: Use PDF compression tools
- **Limit CSV rows**: Include only relevant data
- **Remove images**: If text is what matters
- **Split large files**: Break into logical sections

## Troubleshooting

### Problem: PDF Not Extracting Text

**Possible Causes:**

1. Scanned image PDF (no actual text)
2. Password-protected PDF
3. Corrupted file

**Solutions:**

1. Use OCR tool to convert to text
2. Remove password protection
3. Re-export or re-download file
4. Convert to TXT format manually

### Problem: CSV Not Parsing Correctly

**Possible Causes:**

1. Non-standard delimiter (semicolon, tab)
2. Quoted commas in cells
3. Inconsistent column count

**Solutions:**

1. Convert to standard comma-delimited CSV
2. Remove or escape special characters
3. Ensure all rows have same column count
4. Use Excel "Save As CSV" feature

### Problem: Large File Upload Fails

**Possible Causes:**

1. File exceeds 10MB limit
2. Network timeout
3. Browser memory issue

**Solutions:**

1. Compress or split file
2. Try smaller chunks
3. Use wired connection
4. Refresh and retry

## Future Enhancements

### Phase 1: Advanced PDF Support

- [ ] Lambda function with pdf-parse
- [ ] OCR for scanned documents
- [ ] Table extraction
- [ ] Image extraction

### Phase 2: Office Document Support

- [ ] Word documents (mammoth library)
- [ ] Excel spreadsheets (xlsx library)
- [ ] PowerPoint presentations
- [ ] Google Docs integration

### Phase 3: Advanced Features

- [ ] Multi-file upload
- [ ] Drag-and-drop interface
- [ ] File preview before upload
- [ ] Automatic file type detection
- [ ] Batch processing

## API Reference

### Upload Document

```typescript
import { uploadDocumentAction } from "@/features/intelligence/actions/knowledge-actions";

const result = await uploadDocumentAction(userId, file, {
  scope: "personal", // or 'team'
  teamId: "team-123", // if scope is 'team'
});

if (result.success) {
  console.log("Document uploaded:", result.documentId);
} else {
  console.error("Upload failed:", result.error);
}
```

### Supported File Types Check

```typescript
const supportedTypes = [
  "txt",
  "md",
  "markdown", // Plain text
  "csv", // Spreadsheet data
  "json", // Structured data
  "html",
  "htm", // Web content
  "pdf", // Documents (basic)
];

const isSupported = supportedTypes.includes(fileExtension.toLowerCase());
```

## Summary

| Format  | Status     | Speed   | Quality   | Use Case        |
| ------- | ---------- | ------- | --------- | --------------- |
| TXT, MD | ✅ Perfect | Instant | Excellent | Notes, docs     |
| CSV     | ✅ Perfect | Instant | Excellent | Data tables     |
| JSON    | ✅ Perfect | Instant | Excellent | Structured data |
| HTML    | ✅ Good    | Instant | Good      | Web content     |
| PDF     | ⚠️ Basic   | Fast    | Fair      | Text documents  |
| DOCX    | ❌ Manual  | -       | -         | Convert to TXT  |
| XLSX    | ❌ Manual  | -       | -         | Export to CSV   |

**Recommendation**: For best results, use TXT, MD, CSV, or JSON formats. Convert other formats before uploading.
