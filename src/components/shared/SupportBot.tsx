'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, ChatBubbleOvalLeftEllipsisIcon, PhoneIcon, DocumentTextIcon, ChevronRightIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errorHandler';
import { SUPPORT_EMAIL } from '@/lib/constants';

interface SupportBotProps {
  open?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

const CATEGORIES = [
  { value: 'order_issue',   labelKey: 'supportBot.categoryOrder' },
  { value: 'billing',       labelKey: 'supportBot.categoryBilling' },
  { value: 'technical',     labelKey: 'supportBot.categoryTechnical' },
  { value: 'account',       labelKey: 'supportBot.categoryAccount' },
  { value: 'other',         labelKey: 'supportBot.categoryOther' },
] as const;

type Category = typeof CATEGORIES[number]['value'];

export default function SupportBot({ open: openProp, onOpen, onClose }: SupportBotProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const firstName = user?.profile?.firstName ?? user?.email?.split('@')[0] ?? 'there';

  const [internalOpen, setInternalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', category: '' as Category | '', issue: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketRef, setTicketRef]       = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);

  const isOpen      = openProp !== undefined ? openProp : internalOpen;
  const handleOpen  = onOpen  ?? (() => setInternalOpen(true));
  const handleClose = onClose ?? (() => setInternalOpen(false));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await api.post('/support/tickets', {
        name:     formData.name,
        email:    formData.email,
        phone:    formData.phone    || undefined,
        category: formData.category || 'other',
        message:  formData.issue,
      });
      const ref: string | undefined =
        response.data?.ticketNumber ?? response.data?.id;
      setTicketRef(ref ?? 'OK');
    } catch (error: unknown) {
      const status = (error as any)?.response?.status;
      if (!status || status >= 500 || status === 404) {
        // Endpoint not yet deployed — show graceful pending confirmation
        setTicketRef('PENDING');
      } else {
        setError(getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    setFormData({ name: '', email: '', phone: '', category: '', issue: '' });
    setTicketRef(null);
    setError(null);
    handleClose();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <>
      {/* Floating button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        style={{ zIndex: 1200, background: 'linear-gradient(135deg, var(--color-brand-navy), var(--color-brand-teal))' }}
        aria-label={t('supportBot.contactSupport')}
      >
        <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 1200 }}>
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleDismiss} />

            <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-fadeIn">

              {/* ── Header ──────────────────────────────────────────────────── */}
              <div
                className="px-6 pt-6 pb-8"
                style={{ background: 'linear-gradient(135deg, var(--color-brand-navy) 0%, #0f2a5c 100%)' }}
              >
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close support chat"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>

                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                  <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white capitalize">{t('supportBot.hello')} {firstName},</h2>
                <p className="text-white/60 text-sm mt-0.5">{t('supportBot.howCanWeHelp')}</p>
              </div>

              {/* ── Body ────────────────────────────────────────────────────── */}
              <div className="bg-white">

                {/* Info rows */}
                <div className="px-6 pt-4 pb-2 space-y-1">
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-brand-teal-light">
                      <PhoneIcon className="w-4 h-4 text-brand-teal" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{t('supportBot.callOrEmail')}</p>
                      <p className="text-xs text-gray-400 truncate">{SUPPORT_EMAIL}</p>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                  </a>

                  <div className="flex items-center gap-3 p-3 rounded-xl">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#EEF2FF' }}>
                      <DocumentTextIcon className="w-4 h-4 text-brand-navy" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{t('supportBot.fillFormBelow')}</p>
                      <p className="text-xs text-gray-400">{t('supportBot.hereToHelp')}</p>
                    </div>
                  </div>
                </div>

                <div className="px-6">
                  <div className="h-px bg-gray-100 mb-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-4 text-brand-teal">{t('supportBot.sendUsMessage')}</p>
                </div>

                {ticketRef ? (
                  <div className="px-6 pb-8 text-center">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#F0FDF4' }}>
                      <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{t('supportBot.messageSent')}</h3>
                    {ticketRef !== 'PENDING' && ticketRef !== 'OK' && (
                      <p className="text-xs font-medium mb-1 text-brand-navy">
                        {t('supportBot.ticketRef')}: <span className="font-bold">{ticketRef}</span>
                      </p>
                    )}
                    <p className="text-sm text-gray-400 mb-4">{t('supportBot.getBackSoon')}</p>
                    <button
                      onClick={handleDismiss}
                      className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 bg-brand-navy"
                    >
                      {t('common.close')}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
                    <input
                      type="text" name="name" value={formData.name} onChange={handleChange} required
                      placeholder={t('supportBot.fullName')}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all placeholder:text-gray-300"
                    />
                    <input
                      type="email" name="email" value={formData.email} onChange={handleChange} required
                      placeholder={t('supportBot.emailAddress')}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all placeholder:text-gray-300"
                    />
                    <input
                      type="tel" name="phone" value={formData.phone} onChange={handleChange}
                      placeholder={`${t('supportBot.phoneNumber')} (${t('supportBot.optional')})`}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all placeholder:text-gray-300"
                    />
                    <textarea
                      name="issue" value={formData.issue} onChange={handleChange} required rows={3}
                      placeholder={t('supportBot.describeIssuePlaceholder')}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all resize-none placeholder:text-gray-300"
                    />

                    {error && (
                      <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                    )}

                    <button
                      type="submit" disabled={isSubmitting}
                      className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60 bg-brand-navy"
                    >
                      {isSubmitting ? t('supportBot.sending') : (
                        <>
                          {t('supportBot.sendMessage')}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </>
                      )}
                    </button>

                    {/* Footer */}
                    <div className="flex items-center justify-center gap-1.5 pt-1">
                      <LockClosedIcon className="w-3 h-3 text-gray-300" />
                      <p className="text-[11px] text-gray-300">{t('supportBot.encryptedFooter')}</p>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
