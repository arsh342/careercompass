"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Wallet, Smartphone } from "lucide-react";

interface PaymentFormProps {
  planName: string;
  price: string | number;
  frequency: string;
  onBack?: () => void;
  onSubmit?: () => void;
}

export function PaymentForm({ 
  planName, 
  price, 
  frequency,
  onBack,
  onSubmit 
}: PaymentFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  };

  return (
    <Card className="max-w-md w-full rounded-2xl shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Payment Details</CardTitle>
        <p className="text-sm text-muted-foreground">
          {planName} Plan - {typeof price === "number" ? `$${price}` : price}/{frequency}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Options */}
        <div className="grid grid-cols-3 gap-3">
          <Button variant="outline" className="h-14 flex flex-col items-center justify-center gap-1">
            <Wallet className="h-5 w-5" />
            <span className="text-xs">UPI</span>
          </Button>
          <Button variant="outline" className="h-14 flex flex-col items-center justify-center gap-1">
            <Smartphone className="h-5 w-5" />
            <span className="text-xs">Wallet</span>
          </Button>
          <Button variant="outline" className="h-14 flex flex-col items-center justify-center gap-1 border-primary bg-primary/5">
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="text-xs text-primary">Card</span>
          </Button>
        </div>

        {/* Separator */}
        <div className="flex items-center text-muted-foreground">
          <hr className="flex-grow border-t border-border" />
          <span className="mx-3 text-xs">Pay with credit or debit card</span>
          <hr className="flex-grow border-t border-border" />
        </div>

        {/* Credit Card Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardholder-name">Cardholder Name</Label>
            <Input 
              id="cardholder-name" 
              name="cardholderName" 
              placeholder="Enter your full name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="card-number">Card Number</Label>
            <Input
              id="card-number"
              name="cardNumber"
              placeholder="0000 0000 0000 0000"
              inputMode="numeric"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input
                id="expiry"
                name="expiryDate"
                placeholder="MM/YY"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                name="cvv"
                placeholder="123"
                inputMode="numeric"
                type="password"
                maxLength={4}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {onBack && (
              <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
                Back
              </Button>
            )}
            <Button type="submit" className="flex-1">
              Pay {typeof price === "number" ? `$${price}` : price}
            </Button>
          </div>
        </form>

        <p className="text-xs text-center text-muted-foreground">
          🔒 Your payment information is encrypted and secure
        </p>
      </CardContent>
    </Card>
  );
}
