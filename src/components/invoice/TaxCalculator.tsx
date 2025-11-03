import React, { useState, useEffect } from 'react';
import { Calculator, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { hsnService, HSNCode } from '@/services/hsn';

interface TaxCalculatorProps {
  hsnCode?: HSNCode;
  amount?: number;
  onTaxCalculated?: (taxDetails: TaxCalculation) => void;
  className?: string;
}

export interface TaxCalculation {
  baseAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  totalTax: number;
  totalAmount: number;
  isInterState: boolean;
  hsnCode?: HSNCode;
}

export const TaxCalculator: React.FC<TaxCalculatorProps> = ({
  hsnCode,
  amount = 0,
  onTaxCalculated,
  className = ''
}) => {
  const [baseAmount, setBaseAmount] = useState(amount);
  const [isInterState, setIsInterState] = useState(false);
  const [taxCalculation, setTaxCalculation] = useState<TaxCalculation | null>(null);

  // Calculate tax whenever amount, HSN, or state type changes
  useEffect(() => {
    if (hsnCode && baseAmount > 0) {
      const calculation = hsnService.calculateTax(hsnCode, baseAmount, isInterState);
      
      const taxDetails: TaxCalculation = {
        baseAmount,
        cgst: calculation.cgst,
        sgst: calculation.sgst,
        igst: calculation.igst,
        cess: calculation.cess,
        totalTax: calculation.totalTax,
        totalAmount: calculation.totalAmount,
        isInterState,
        hsnCode
      };
      
      setTaxCalculation(taxDetails);
      
      if (onTaxCalculated) {
        onTaxCalculated(taxDetails);
      }
    } else {
      setTaxCalculation(null);
      if (onTaxCalculated) {
        onTaxCalculated({
          baseAmount,
          cgst: 0,
          sgst: 0,
          igst: 0,
          cess: 0,
          totalTax: 0,
          totalAmount: baseAmount,
          isInterState,
        });
      }
    }
  }, [hsnCode, baseAmount, isInterState, onTaxCalculated]);

  // Update amount when prop changes
  useEffect(() => {
    setBaseAmount(amount);
  }, [amount]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setBaseAmount(value);
  };

  if (!hsnCode) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Calculator className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Select an HSN/SAC code to calculate taxes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          Tax Calculator
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* HSN Info */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-blue-900 text-sm">
                HSN: {hsnCode.hsn}
              </div>
              <div className="text-blue-700 text-xs mt-1">
                {hsnCode.description}
              </div>
            </div>
            <Badge variant="outline" className="bg-white">
              {hsnCode.category}
            </Badge>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium">
            Base Amount
          </Label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="amount"
              type="number"
              value={baseAmount}
              onChange={handleAmountChange}
              placeholder="0.00"
              className="pl-10"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        {/* Inter-state Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="interstate" className="text-sm font-medium">
            Inter-state Transaction
          </Label>
          <Switch
            id="interstate"
            checked={isInterState}
            onCheckedChange={setIsInterState}
          />
        </div>

        {/* Tax Breakdown */}
        {taxCalculation && (
          <>
            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-900">Tax Breakdown</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Amount:</span>
                  <span className="font-medium">₹{baseAmount.toFixed(2)}</span>
                </div>
                
                {isInterState ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600">IGST ({hsnCode.igst}%):</span>
                    <span className="font-medium">₹{taxCalculation.igst.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CGST ({hsnCode.cgst}%):</span>
                      <span className="font-medium">₹{taxCalculation.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">SGST ({hsnCode.sgst}%):</span>
                      <span className="font-medium">₹{taxCalculation.sgst.toFixed(2)}</span>
                    </div>
                  </>
                )}
                
                {hsnCode.cess && taxCalculation.cess > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cess ({hsnCode.cess}%):</span>
                    <span className="font-medium">₹{taxCalculation.cess.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between font-medium">
                  <span>Total Tax:</span>
                  <span className="text-blue-600">₹{taxCalculation.totalTax.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Final Amount:</span>
                  <span className="text-green-600">₹{taxCalculation.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TaxCalculator;