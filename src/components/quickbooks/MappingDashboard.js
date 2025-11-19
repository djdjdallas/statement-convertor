'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  Settings,
  CheckCircle,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import AccountMappingWizard from './AccountMappingWizard';

export default function MappingDashboard() {
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [mappingData, setMappingData] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchMappingData();
    }
  }, [user]);

  const fetchMappingData = async () => {
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
        setMappingData(data);
      } else if (response.status === 404) {
        // No connection yet
        setMappingData(null);
      }
    } catch (error) {
      console.error('Error fetching mapping data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load mapping data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWizardComplete = () => {
    setShowWizard(false);
    fetchMappingData();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (showWizard) {
    return <AccountMappingWizard onComplete={handleWizardComplete} />;
  }

  const stats = mappingData?.stats || {};
  const hasMappings = stats.totalCategoryMappings > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Account Mappings
            </CardTitle>
            <CardDescription>
              Configure how your transaction categories map to QuickBooks accounts
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowWizard(true)}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {hasMappings ? 'Reconfigure' : 'Set Up'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {hasMappings ? (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalCategoryMappings}
                </div>
                <div className="text-sm text-blue-700">Categories Mapped</div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.autoMappedCategories}
                </div>
                <div className="text-sm text-green-700">AI-Generated</div>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.avgCategoryConfidence}%
                </div>
                <div className="text-sm text-purple-700">Avg Confidence</div>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.totalMerchantMappings || 0}
                </div>
                <div className="text-sm text-orange-700">Merchants Mapped</div>
              </div>
            </div>

            {/* Confidence Breakdown */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Mapping Quality
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Overall Confidence</span>
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    {stats.avgCategoryConfidence}%
                  </Badge>
                </div>
                <Progress value={stats.avgCategoryConfidence} className="h-2" />
                <p className="text-xs text-gray-500">
                  {stats.avgCategoryConfidence >= 90
                    ? 'Excellent! Your mappings are highly accurate.'
                    : stats.avgCategoryConfidence >= 70
                    ? 'Good mappings. Consider reviewing low-confidence categories.'
                    : 'Some mappings need review. Click "Reconfigure" to improve accuracy.'}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setShowWizard(true)}
                variant="outline"
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit Mappings
              </Button>
              <Button
                onClick={fetchMappingData}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <AlertCircle className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">No Mappings Configured</h4>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
              Before you can sync transactions to QuickBooks, you need to configure how
              your transaction categories map to QuickBooks Chart of Accounts.
            </p>
            <Button
              onClick={() => setShowWizard(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Set Up Mappings with AI
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
