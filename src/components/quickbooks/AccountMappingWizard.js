'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Settings,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountMappingWizard({ onComplete }) {
  const [step, setStep] = useState(1); // 1: Generate, 2: Review, 3: Confirm
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [categoryMappings, setCategoryMappings] = useState([]);
  const [qbAccounts, setQbAccounts] = useState([]);
  const [stats, setStats] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAccounts();
      fetchExistingMappings();
    }
  }, [user]);

  const fetchAccounts = async () => {
    try {
      const token = await user.getSession();
      const response = await fetch('/api/quickbooks/accounts?type=accounts', {
        headers: {
          'Authorization': `Bearer ${token.session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQbAccounts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching QB accounts:', error);
    }
  };

  const fetchExistingMappings = async () => {
    setLoading(true);
    try {
      const token = await user.getSession();
      const response = await fetch('/api/quickbooks/mappings', {
        headers: {
          'Authorization': `Bearer ${token.session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.categoryMappings && data.categoryMappings.length > 0) {
          setCategoryMappings(data.categoryMappings);
          setStats(data.stats);
          setStep(2); // Skip to review if mappings exist
        }
      }
    } catch (error) {
      console.error('Error fetching existing mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIMappings = async () => {
    setGenerating(true);
    try {
      const token = await user.getSession();
      const response = await fetch('/api/quickbooks/mappings/auto-suggest', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'categories' }),
      });

      if (response.ok) {
        const data = await response.json();
        setCategoryMappings(data.mappings || []);
        setStep(2);

        toast({
          title: 'AI Mappings Generated',
          description: `Generated ${data.count} category mappings with AI`,
        });
      } else {
        throw new Error('Failed to generate mappings');
      }
    } catch (error) {
      console.error('Error generating AI mappings:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate AI mappings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const saveMappings = async () => {
    setLoading(true);
    try {
      const token = await user.getSession();
      const response = await fetch('/api/quickbooks/mappings/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mappings: categoryMappings }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Category mappings saved successfully',
        });
        setStep(3);
      } else {
        throw new Error('Failed to save mappings');
      }
    } catch (error) {
      console.error('Error saving mappings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save mappings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMapping = (index, field, value) => {
    const updated = [...categoryMappings];
    updated[index][field] = value;

    // If changing account, update related fields
    if (field === 'qb_account_id') {
      const account = qbAccounts.find(a => a.Id === value);
      if (account) {
        updated[index].qb_account_name = account.Name;
        updated[index].qb_account_type = account.AccountType;
        updated[index].auto_mapped = false; // Mark as manually modified
      }
    }

    setCategoryMappings(updated);
  };

  const removeMapping = (index) => {
    setCategoryMappings(categoryMappings.filter((_, i) => i !== index));
  };

  const getConfidenceBadge = (confidence) => {
    if (confidence >= 90) {
      return <Badge className="bg-green-100 text-green-700 border-green-300">High</Badge>;
    } else if (confidence >= 70) {
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Medium</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-700 border-red-300">Low</Badge>;
    }
  };

  if (loading && step === 1) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Account Mapping Setup
        </CardTitle>
        <CardDescription>
          Map your transaction categories to QuickBooks Chart of Accounts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center gap-2 pb-6 border-b">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {step > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
            </div>
            <span className="text-sm font-medium">Generate</span>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {step > 2 ? <CheckCircle className="h-5 w-5" /> : '2'}
            </div>
            <span className="text-sm font-medium">Review</span>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {step >= 3 ? <CheckCircle className="h-5 w-5" /> : '3'}
            </div>
            <span className="text-sm font-medium">Complete</span>
          </div>
        </div>

        {/* Step 1: Generate */}
        {step === 1 && (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-50 rounded-full">
                <Sparkles className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">AI-Powered Mapping</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Let Claude AI analyze your transaction categories and automatically map them
              to the most appropriate QuickBooks accounts based on accounting best practices.
            </p>
            <Button
              onClick={generateAIMappings}
              disabled={generating}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Mappings...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Mappings
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Review and adjust the AI-generated mappings below. You can change any mapping
                or remove categories you don't want to sync.
              </AlertDescription>
            </Alert>

            <div className="max-h-96 overflow-y-auto space-y-3">
              {categoryMappings.map((mapping, index) => (
                <div key={index} className="p-4 border rounded-lg bg-white hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{mapping.category}</span>
                        {mapping.auto_mapped && (
                          <Badge variant="outline" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI
                          </Badge>
                        )}
                        {getConfidenceBadge(mapping.confidence)}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">→</span>
                        <select
                          value={mapping.qb_account_id}
                          onChange={(e) => updateMapping(index, 'qb_account_id', e.target.value)}
                          className="text-sm border rounded px-2 py-1 flex-1"
                        >
                          <option value="">Select QB Account...</option>
                          {qbAccounts
                            .filter(acc => ['Expense', 'Income', 'Other Expense', 'Cost of Goods Sold', 'Other Income'].includes(acc.AccountType))
                            .map(acc => (
                              <option key={acc.Id} value={acc.Id}>
                                {acc.Name} ({acc.AccountType})
                              </option>
                            ))}
                        </select>
                      </div>

                      {mapping.reasoning && (
                        <p className="text-xs text-gray-500 italic">{mapping.reasoning}</p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMapping(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
              >
                Back
              </Button>
              <Button
                onClick={saveMappings}
                disabled={loading || categoryMappings.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  `Save ${categoryMappings.length} Mappings`
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-50 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Mappings Configured!</h3>
            <p className="text-gray-600 mb-6">
              Your category mappings have been saved. You're ready to start syncing
              transactions to QuickBooks.
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{categoryMappings.length}</div>
                <div className="text-sm text-gray-600">Categories Mapped</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {categoryMappings.filter(m => m.confidence >= 90).length}
                </div>
                <div className="text-sm text-gray-600">High Confidence</div>
              </div>
            </div>

            <Button
              onClick={onComplete}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Continue to Sync
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
