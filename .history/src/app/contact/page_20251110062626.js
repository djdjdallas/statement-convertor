"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, MessageSquare, Phone, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ContactPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    company: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const supabase = createClient();
      
      const submission = {
        ...formData,
        user_id: user?.id || null,
        user_agent: navigator.userAgent
      };

      const { error: submitError } = await supabase
        .from('contact_submissions')
        .insert([submission]);

      if (submitError) throw submitError;

      setSuccess(true);
      setFormData({
        name: '',
        email: user?.email || '',
        company: '',
        subject: '',
        message: ''
      });
      
      toast({
        title: 'Message Sent',
        description: 'Thank you for contacting us. We\'ll get back to you soon!',
        variant: 'success'
      });

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error('Contact form error:', err);
      setError('Failed to send message. Please try again.');
      toast({
        title: 'Failed to Send Message',
        description: err.message || 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email',
      description: 'Send us an email anytime',
      value: 'support@statementdesk.com',
      action: 'mailto:support@statementdesk.com'
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Chat with our support team',
      value: 'Available 9am-5pm EST',
      action: '#'
    },
    {
      icon: Phone,
      title: 'Phone',
      description: 'Call us during business hours',
      value: '+1 (555) 123-4567',
      action: 'tel:+15551234567'
    }
  ];

  const officeInfo = [
    {
      icon: MapPin,
      title: 'Office',
      value: '123 Financial District\nNew York, NY 10004'
    },
    {
      icon: Clock,
      title: 'Business Hours',
      value: 'Monday - Friday\n9:00 AM - 5:00 PM EST'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Get in Touch
            </h1>
            <p className="mt-4 text-xl text-blue-100">
              We're here to help with your bank statement conversion needs
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Methods */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Options</h2>
              <div className="space-y-4">
                {contactMethods.map((method, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start">
                        <method.icon className="h-6 w-6 text-blue-600 mt-1" />
                        <div className="ml-4 flex-1">
                          <h3 className="font-semibold text-gray-900">{method.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                          <a 
                            href={method.action}
                            className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                          >
                            {method.value}
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Office Information</h3>
              <div className="space-y-4">
                {officeInfo.map((info, index) => (
                  <div key={index} className="flex items-start">
                    <info.icon className="h-5 w-5 text-gray-400 mt-1" />
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{info.title}</p>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{info.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                {success && (
                  <Alert className="mb-6 bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Thank you for your message! We'll get back to you soon.
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert className="mb-6 bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Acme Inc."
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        placeholder="How can we help?"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      placeholder="Tell us more about your needs..."
                      className="resize-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading} size="lg">
                      {loading ? 'Sending...' : 'Send Message'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-2">
                    What types of bank statements can you convert?
                  </h4>
                  <p className="text-gray-600">
                    We support PDF bank statements from over 200 banks worldwide. Our AI can handle both 
                    native PDFs and scanned documents.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-2">
                    How long does support typically take to respond?
                  </h4>
                  <p className="text-gray-600">
                    We aim to respond to all inquiries within 24 hours during business days. 
                    Premium customers receive priority support with faster response times.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Do you offer phone support?
                  </h4>
                  <p className="text-gray-600">
                    Phone support is available for Business and Enterprise customers during business hours. 
                    All customers can reach us via email and chat support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}