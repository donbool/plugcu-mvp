import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
            Welcome to <span className="text-blue-600">PlugCU</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Connecting student organizations with brands for sponsorships, collaborations, and event support
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/login">
              <Button size="lg" className="px-8">
                Get Started
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg" className="px-8">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-blue-600">For Student Organizations</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>• Create your organization profile</li>
              <li>• Post sponsorship opportunities</li>
              <li>• Connect with interested brands</li>
              <li>• Secure funding for your events</li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-green-600">For Brands</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>• Discover active campus communities</li>
              <li>• Browse sponsorship opportunities</li>
              <li>• Connect with student organizations</li>
              <li>• Expand your campus presence</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}