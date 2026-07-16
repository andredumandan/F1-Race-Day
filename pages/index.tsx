import Head from 'next/head'
import Header from '../src/components/Header'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>F1 Companion</title>
        <meta name="description" content="Live F1 companion app" />
      </Head>
      <Header />
      <main className="flex-1 p-4">Home page – placeholder.</main>
    </div>
  )
}
