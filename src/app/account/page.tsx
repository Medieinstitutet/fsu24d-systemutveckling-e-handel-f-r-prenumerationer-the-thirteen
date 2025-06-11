'use client';

import React, { useEffect, useState } from 'react';
import { getSubscriptionStatus, cancelSubscription } from '@/services/stripe-service';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SubscriptionStatus {
  email?: string;
  level: 'free' | 'basic' | 'pro' | 'premium';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  endDate?: string;
  stripeDetails?: {
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  };
}

export default function AccountPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  
  useEffect(() => {
    async function fetchSubscriptionStatus() {
      if (sessionStatus !== 'authenticated') return;
      
      try {
        setError('');
        const data = await getSubscriptionStatus();
        console.log("Prenumerationsdata:", data);
        setSubscription(data);
      } catch (error) {
        console.error('Fel vid hämtning av prenumerationsstatus:', error);
        setError('Kunde inte hämta prenumerationsinformation. Försök igen senare.');
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchSubscriptionStatus();
    }
  }, [session, sessionStatus]);

  
  const handleCancelSubscription = async () => {
    if (window.confirm('Är du säker på att du vill avsluta din prenumeration? Du kommer att ha tillgång till tjänsten till slutet av nuvarande betalperiod.')) {
      setCancelLoading(true);
      try {
        const result = await cancelSubscription();
        setMessage(result.message);
       
        const updatedData = await getSubscriptionStatus();
        setSubscription(updatedData);
      } catch (error) {
        console.error('Fel vid avslutning av prenumeration:', error);
        setMessage('Det gick inte att avsluta prenumerationen. Försök igen senare.');
      } finally {
        setCancelLoading(false);
      }
    }
  };

 
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Okänt datum';
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

 
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'basic': return 'text-blue-600';
      case 'pro': return 'text-indigo-600';
      case 'premium': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

 
  const translateStatus = (status: string) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'canceled': return 'Kommer att avslutas';
      case 'past_due': return 'Betalning försenad';
      case 'unpaid': return 'Obetald';
      default: return status;
    }
  };

 
  const getSubscriptionLevelName = (level: string) => {
    switch (level) {
      case 'free': return 'Gratisversion';
      case 'basic': return 'Basic';
      case 'pro': return 'Pro';
      case 'premium': return 'Premium';
      default: return level;
    }
  };

 
  const canCancelSubscription = () => {
    if (!subscription) return false;
    
   
    return (
      subscription.level !== 'free' && 
      subscription.status === 'active' && 
     
      (subscription.stripeDetails 
        ? !subscription.stripeDetails.cancelAtPeriodEnd 
        : true)
    );
  };

 
  if (sessionStatus === 'loading' || sessionStatus === 'unauthenticated') {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p>Kontrollerar inloggningsstatus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Mitt konto</h1>
      
      {loading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p>Laddar prenumerationsinformation...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Försök igen
          </button>
        </div>
      ) : !subscription ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p>Kunde inte hämta prenumerationsinformation.</p>
        </div>
      ) : (
        <>
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
              {message}
            </div>
          )}

          <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-semibold">Din prenumeration</h2>
            </div>
            
            <div className="p-6">
              {subscription.level === 'free' ? (
                <div className="space-y-4">
                  <p className="text-gray-700">
                    Du använder för närvarande <span className="font-medium">gratisversionen</span> av D13 Nyhetsbrev.
                  </p>
                  <p className="text-gray-600">
                    Med en betald prenumeration får du tillgång till fler artiklar och innehåll.
                  </p>
                  <div className="mt-4">
                    <Link href="/subscriptions" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Uppgradera din prenumeration
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Nivå</h3>
                      <p className={`mt-1 text-lg font-medium ${getLevelColor(subscription.level)}`}>
                        {getSubscriptionLevelName(subscription.level)}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <p className="mt-1 text-lg font-medium">
                        {translateStatus(subscription.status)}
                      </p>
                    </div>
                  
                    
                    {subscription.stripeDetails && (
                      <>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Nuvarande period</h3>
                          <p className="mt-1">
                            {formatDate(subscription.stripeDetails.currentPeriodStart)} - {formatDate(subscription.stripeDetails.currentPeriodEnd)}
                          </p>
                        </div>
                        
                        {subscription.stripeDetails.cancelAtPeriodEnd && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Avslutas</h3>
                            <p className="mt-1">
                              {formatDate(subscription.stripeDetails.currentPeriodEnd)}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    
                    
                    {subscription.endDate && !subscription.stripeDetails && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Slutdatum</h3>
                        <p className="mt-1">
                          {formatDate(subscription.endDate)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {canCancelSubscription() && (
                    <div className="mt-6">
                      <button
                        onClick={handleCancelSubscription}
                        disabled={cancelLoading}
                        className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        {cancelLoading ? 'Bearbetar...' : 'Avsluta prenumeration'}
                      </button>
                      <p className="mt-2 text-sm text-gray-500">
                        Din prenumeration kommer att fortsätta gälla till slutet av din nuvarande fakturaperiod.
                      </p>
                    </div>
                  )}
                  
                  {subscription.status === 'canceled' && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-md">
                      <p className="text-sm text-yellow-700">
                        Din prenumeration är uppsagd och kommer att avslutas {
                          subscription.stripeDetails 
                            ? formatDate(subscription.stripeDetails.currentPeriodEnd)
                            : subscription.endDate 
                              ? formatDate(subscription.endDate)
                              : 'vid slutet av nuvarande period'
                        }. 
                        Du har tillgång till allt innehåll fram till detta datum.
                      </p>
                    </div>
                  )}

                  {subscription.status === 'past_due' && (
                    <div className="mt-4 p-4 bg-red-50 rounded-md">
                      <p className="text-sm text-red-700">
                        Din senaste betalning misslyckades. För att behålla tillgången till prenumerationsinnehåll, vänligen uppdatera din betalningsinformation.
                      </p>
                      <Link href="/api/subscription/retry-payment" className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                        Uppdatera betalningsinformation
                      </Link>
                    </div>
                  )}
                  
                  {subscription.status === 'unpaid' && (
                    <div className="mt-4 p-4 bg-red-50 rounded-md">
                      <p className="text-sm text-red-700">
                        Din prenumeration är för närvarande inaktiv på grund av utebliven betalning. Din åtkomst till premiuminnehåll kommer att begränsas.
                      </p>
                      <Link href="/api/subscription/retry-payment" className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                        Betala nu
                      </Link>
                    </div>
                  )}

                  {subscription.level !== 'premium' && subscription.status === 'active' && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <p className="text-sm text-gray-600">Vill du uppgradera till en högre prenumerationsnivå?</p>
                      <Link href="/subscriptions" className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Uppgradera prenumeration
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow">
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-semibold">Kontodetaljer</h2>
            </div>
            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">E-post</h3>
                  <p className="mt-1">{subscription.email || session?.user?.email || "Inte tillgänglig"}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}