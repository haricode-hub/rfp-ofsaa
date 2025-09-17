"use client";

import Link from 'next/link';
import { 
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Layout, useTheme } from '@/components/ui/Layout';

function HomeContent() {
  const { isDarkMode } = useTheme();

  return (
    <div className="min-h-screen transition-colors duration-300"
         style={{
           backgroundColor: 'var(--bg-primary)',
           color: 'var(--text-primary)'
         }}>
      {/* Hero Section */}
      <section className="pt-32 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="heading-1-hero mb-6">
            Powerful Document
            <span className="block" style={{ color: 'var(--text-secondary)' }}>
              Processing Tools
            </span>
          </h1>
          <p className="body-text-large mb-10 max-w-2xl mx-auto">
            Streamline your workflow with AI-powered document analysis, Excel processing, 
            and professional document generation tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="#services"
              className="btn btn-primary btn-lg"
            >
              Get Started
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              href="#about"
              className="btn btn-secondary btn-lg"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="section"
               style={{
                 backgroundColor: isDarkMode ? 'var(--bg-secondary)' : 'var(--bg-secondary)'
               }}>
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="heading-1 mb-4">
              Our Services
            </h2>
            <p className="body-text-large max-w-2xl mx-auto">
              Choose from our suite of powerful tools designed to enhance your document processing workflow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Chat with Doc */}
            <div className="card p-8">
              <h3 className="service-title mb-4">
                Chat Agent
              </h3>
              <p className="body-text mb-6">
                Upload any kinds of document and have intelligent conversations about its content. 
                Ask questions, get summaries, and extract insights with AI assistance.
              </p>
              <Link 
                href="/chat-with-doc"
                className="inline-flex items-center font-semibold transition-colors"
                style={{
                  color: 'var(--blue-primary)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--blue-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--blue-primary)';
                }}
              >
                Try Chat Agent
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {/* PresaleBot */}
            <div className="card p-8">
              <h3 className="service-title mb-4">
                Presale Agent
              </h3>
              <p className="body-text mb-6">
                Process Excel files intelligently with AI and automate spreadsheet operations effortlessly.
              </p>
              <Link 
                href="/excelbot"
                className="inline-flex items-center font-semibold transition-colors"
                style={{
                  color: 'var(--blue-primary)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--blue-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--blue-primary)';
                }}
              >
                Try Presale Agent
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {/* FSD Document Generator */}
            <div className="card p-8">
              <h3 className="service-title mb-4">
                FSD Agent
              </h3>
              <p className="body-text mb-6">
                Generate comprehensive Functional Specification Documents from your requirements. 
                Professional formatting with advanced Word document features.
              </p>
              <Link 
                href="/fsd-generator"
                className="inline-flex items-center font-semibold transition-colors"
                style={{
                  color: 'var(--blue-primary)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--blue-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--blue-primary)';
                }}
              >
                Try FSD Agent
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section"
               style={{
                 backgroundColor: 'var(--bg-primary)'
               }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="heading-1 mb-6">
            About Our Platform
          </h2>
          <p className="body-text-large mb-8">
            SensAi is the hub of AI-powered tools within our organization, 
            designed to handle every type of document—Excel, PDFs, Word files, and more. 
            Beyond streamlining document management, SensAi enables intelligent content generation 
            and in-depth analysis using AI. By combining advanced artificial intelligence with an intuitive interface,
             SensAi empowers teams to process, create, 
            and analyze documents efficiently, ensuring smarter workflows and faster results.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="heading-2-large mb-2">
                AI-Powered
              </div>
              <p className="body-text">
                Advanced AI models for intelligent document processing
              </p>
            </div>
            <div className="text-center">
              <div className="heading-2-large mb-2">
                Secure
              </div>
              <p className="body-text">
                Enterprise-grade security for your sensitive documents
              </p>
            </div>
            <div className="text-center">
              <div className="heading-2-large mb-2">
                Fast
              </div>
              <p className="body-text">
                Lightning-fast processing and real-time results
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section"
               style={{
                 backgroundColor: isDarkMode ? 'var(--bg-secondary)' : 'var(--bg-secondary)'
               }}>
        <div className="max-w-2xl mx-auto text-center">
          
          <div className={`rounded-2xl p-8 shadow-sm space-y-4 text-center ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <h3 className={`font-bold text-3xl ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>
               Connect With Us
            </h3>
            <p className={`leading-relaxed ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Transform the way you handle documents with AI-driven automation. Our team is here to guide you every step of the way
              Unlock smarter document processing today — try it free and see the difference.
            </p>
            <div className="pt-4">
              <button className={`font-medium px-6 py-3 rounded-lg shadow-md text-white transition-colors ${
                isDarkMode 
                  ? 'bg-blue-500 hover:bg-blue-400' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}>
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <Layout showNavigation={true} showFooter={true}>
      <HomeContent />
    </Layout>
  );
}