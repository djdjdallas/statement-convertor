'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  TrendingUp,
  DollarSign,
  PieChart,
  RefreshCw,
  Lightbulb,
  Copy,
  Check,
  Trash2,
  Download
} from 'lucide-react'

export default function FinancialChat({ transactions, userProfile, className = "" }) {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedPrompts, setSuggestedPrompts] = useState([])
  const [conversationId] = useState('default')
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    // Initialize chat with welcome message and suggestions
    initializeChat()
  }, [transactions, userProfile])

  useEffect(() => {
    // Scroll to bottom when new messages are added
    scrollToBottom()
  }, [messages])

  const initializeChat = async () => {
    try {
      // Get initial suggestions
      const response = await fetch('/api/chat/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transactions: transactions.slice(0, 100), // Limit for performance
          userProfile 
        }),
        credentials: 'same-origin'
      })

      const result = await response.json()
      
      if (result.success) {
        setSuggestedPrompts(result.suggestions)
        
        // Add welcome message
        setMessages([{
          id: 'welcome',
          type: 'assistant',
          message: `Hi! I'm your AI financial assistant. I can help you analyze your ${transactions.length} transactions and answer questions about your finances. What would you like to know?`,
          timestamp: new Date().toISOString(),
          suggestions: result.suggestions.slice(0, 3)
        }])
      }
    } catch (error) {
      console.error('Chat initialization error:', error)
      setMessages([{
        id: 'error',
        type: 'assistant',
        message: "Hello! I'm your financial assistant. I'm ready to help you analyze your financial data. What would you like to know?",
        timestamp: new Date().toISOString(),
        suggestions: [
          "How much did I spend last month?",
          "What's my biggest spending category?",
          "Show me my recent transactions"
        ]
      }])
    }
  }

  const sendMessage = async (message = inputValue.trim()) => {
    if (!message || isLoading) return

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      message,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: message,
          transactions: transactions.slice(0, 500), // Limit for performance
          userProfile,
          conversationId
        }),
        credentials: 'same-origin'
      })

      const result = await response.json()

      if (result.success) {
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          message: result.response,
          timestamp: new Date().toISOString(),
          data: result.data,
          suggestions: result.suggestions,
          intent: result.intent
        }

        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(result.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        message: "I'm sorry, I encountered an error processing your question. Please try rephrasing it or ask something else.",
        timestamp: new Date().toISOString(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const copyToClipboard = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const clearChat = () => {
    setMessages([])
    initializeChat()
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderMessageData = (data) => {
    if (!data || Object.keys(data).length === 0) return null

    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
        {data.key_metrics && Object.keys(data.key_metrics).length > 0 && (
          <div className="mb-3">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Key Metrics
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(data.key_metrics).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span className="font-medium">
                    {typeof value === 'number' && key.includes('amount') ? formatCurrency(value) : value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.transactions && data.transactions.length > 0 && (
          <div className="mb-3">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <PieChart className="h-4 w-4 mr-1" />
              Relevant Transactions ({data.transactions.length})
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {data.transactions.slice(0, 5).map((transaction, index) => (
                <div key={index} className="flex justify-between text-sm p-1">
                  <span className="truncate max-w-xs">{transaction.description}</span>
                  <span className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              ))}
              {data.transactions.length > 5 && (
                <div className="text-xs text-gray-500 text-center pt-1">
                  ... and {data.transactions.length - 5} more
                </div>
              )}
            </div>
          </div>
        )}

        {data.insights && data.insights.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <Lightbulb className="h-4 w-4 mr-1" />
              Insights
            </h4>
            <div className="space-y-1">
              {data.insights.map((insight, index) => (
                <div key={index} className="text-sm text-gray-700 flex items-start">
                  <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
              Financial Assistant
              <Sparkles className="h-4 w-4 ml-2 text-purple-500" />
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {transactions.length} transactions
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-start space-x-2 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : message.isError 
                          ? 'bg-red-100 text-red-600'
                          : 'bg-purple-100 text-purple-600'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>

                    <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : message.isError
                            ? 'bg-red-50 text-red-900 border border-red-200'
                            : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        
                        {message.type === 'assistant' && !message.isError && (
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(message.timestamp)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(message.message, message.id)}
                              className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                            >
                              {copiedMessageId === message.id ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Render additional data for assistant messages */}
                      {message.type === 'assistant' && message.data && (
                        renderMessageData(message.data)
                      )}

                      {/* Suggested follow-up questions */}
                      {message.type === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
                          {message.suggestions.slice(0, 3).map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => sendMessage(suggestion)}
                              disabled={isLoading}
                              className="mr-2 mb-1 text-xs h-7"
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions (shown when no messages or at start) */}
          {messages.length <= 1 && suggestedPrompts.length > 0 && (
            <div className="p-4 border-t bg-gray-50">
              <p className="text-sm text-gray-600 mb-3">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.slice(0, 4).map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(prompt)}
                    disabled={isLoading}
                    className="text-xs h-8"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t bg-white">
            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about your finances..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={isLoading || !inputValue.trim()}
                size="sm"
                className="px-3"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="mt-2 text-xs text-gray-500 text-center">
              Ask about spending, income, categories, trends, budgets, or forecasts
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}