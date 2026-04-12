import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

interface ApplicationStatusProps {
  status: 'pending' | 'approved' | 'rejected';
  onBackToDashboard: () => void;
  onViewApproval?: () => void;
}

export function ApplicationStatus({ status, onBackToDashboard, onViewApproval }: ApplicationStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="w-20 h-20 text-yellow-500" />;
      case 'approved':
        return <CheckCircle2 className="w-20 h-20 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-20 h-20 text-red-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Under Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Rejected</Badge>;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return "You will be notified once a decision is made.";
      case 'approved':
        return "Your credit application has been approved! Funds will be added to your wallet.";
      case 'rejected':
        return "Unfortunately, your application was not approved at this time. Please review your profile and try again.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
      <Card className="max-w-lg w-full p-8">
        <div className="flex justify-center mb-6">
          {getStatusIcon()}
        </div>
        
        <h1 className="text-3xl text-center mb-4">Application Submitted</h1>
        
        <div className="flex justify-center mb-6">
          {getStatusBadge()}
        </div>

        <p className="text-center text-muted-foreground mb-8">
          {getStatusText()}
        </p>

        <div className="space-y-3">
          {status === 'approved' && onViewApproval && (
            <Button onClick={onViewApproval} className="w-full" size="lg">
              View Approval Details
            </Button>
          )}
          <Button 
            onClick={onBackToDashboard} 
            variant={status === 'approved' ? 'outline' : 'default'}
            className="w-full" 
            size="lg"
          >
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
