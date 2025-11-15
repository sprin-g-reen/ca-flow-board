#!/bin/bash

# Views Enhancement - Installation Script
# This script completes the setup after freeing up disk space

echo "========================================="
echo "CA Flow Board - Views Enhancement Setup"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    echo "   cd /Users/rohithaditya/Documents/ca-flow-board/backend"
    exit 1
fi

echo "📦 Installing required packages..."
echo "   - json2csv: CSV export functionality"
echo "   - pdfkit: PDF generation"
echo "   - exceljs: Excel export functionality"
echo ""

npm install json2csv pdfkit exceljs

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Packages installed successfully!"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Restart your backend server:"
    echo "      npm run dev"
    echo ""
    echo "   2. Open your browser to:"
    echo "      http://127.0.0.1:5173"
    echo ""
    echo "   3. Navigate to Views and test:"
    echo "      - Build a query"
    echo "      - View results in table"
    echo "      - Export as CSV/Excel/PDF"
    echo ""
    echo "📚 Documentation:"
    echo "   - Quick Start: docs/VIEWS_SETUP.md"
    echo "   - Full Docs: docs/VIEWS_ENHANCEMENT.md"
    echo "   - Summary: docs/VIEWS_COMPLETE_SUMMARY.md"
    echo ""
else
    echo ""
    echo "❌ Installation failed!"
    echo ""
    echo "Common issues:"
    echo "   1. Disk space full (ENOSPC error)"
    echo "      → Free up space: du -sh ~/Library/Caches"
    echo "      → Clear npm cache: npm cache clean --force"
    echo ""
    echo "   2. Permission issues"
    echo "      → Try with sudo: sudo npm install json2csv pdfkit exceljs"
    echo ""
    echo "   3. Network issues"
    echo "      → Check internet connection"
    echo "      → Try different npm registry"
    echo ""
fi

echo "========================================="
