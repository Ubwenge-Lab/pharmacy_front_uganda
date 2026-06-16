'use client';

import { formatCurrency } from '@/lib/currency';
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, ShieldCheckIcon, BanknotesIcon, DocumentTextIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/errorHandler';

interface OrderItem {
  quantity: number;
  price: number;
  medication: { name: string };
}

export interface CashierOrder {
  id: string;
  status: string;
  total: number;
  patientPayment?: number;
  patient: {
    firstName: string;
    lastName: string;
    phone?: string;
    user?: { phone?: string };
  };
  orderItems: OrderItem[];
}

type PaymentMethod = 'cash' | 'card' | 'mtn_momo' | 'airtel_money' | 'insurance';

interface ReceiptData {
  receiptNumber: string;
  amount: number;
  method: string;
  timestamp: string;
  reference?: string;
}

interface CashierPOSModalProps {
  open: boolean;
  onClose: () => void;
  order: CashierOrder | null;
  cashierName: string;
  onAdvance: (orderId: string) => void;
}

function fmt(n: number) {
  return `UGX ${Number(n ?? 0).toLocaleString()}`;
}

export default function CashierPOSModal({
  open,
  onClose,
  order,
  cashierName,
  onAdvance,
}: CashierPOSModalProps) {
  const { t } = useTranslation();

  const [tab, setTab] = useState<'verify' | 'record'>('verify');
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'loading' | 'confirmed'>('idle');
  const [confirming, setConfirming] = useState(false);

  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [reference, setReference] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setTab('verify');
        setVerifyStatus('idle');
        setMethod('cash');
        setAmountReceived('');
        setReference('');
        setPhoneNumber('');
        setInsuranceProvider('');
        setPolicyNumber('');
        setNotes('');
        setSubmitting(false);
        setReceipt(null);
        setConfirming(false);
      }, 200);
      return () => clearTimeout(timer);
    } else if (order) {
      setPhoneNumber(order.patient.phone || order.patient.user?.phone || '');
    }
  }, [open, order]);

  const totalDue = order ? (order.patientPayment ?? order.total) : 0;
  const change = useMemo(() => {
    if (method !== 'cash') return 0;
    const recv = Number(amountReceived);
    return isNaN(recv) ? 0 : Math.max(0, recv - totalDue);
  }, [amountReceived, method, totalDue]);

  if (!open || !order) return null;

  const handleVerify = async () => {
    setVerifyStatus('loading');
    try {
      await api.get(`/payments/verify/${order.id}`);
      setVerifyStatus('confirmed');
      setReceipt({
        receiptNumber: `FLW-${order.id.slice(0, 8).toUpperCase()}`,
        amount: totalDue,
        method: t('cashier.flutterwaveOnline'),
        timestamp: new Date().toLocaleString(),
        reference: order.id,
      });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      setVerifyStatus('idle');
    }
  };

  const canConfirmRecord = (() => {
    if (method === 'cash') {
      const recv = Number(amountReceived);
      return !isNaN(recv) && recv >= totalDue;
    }
    if (method === 'insurance') {
      return insuranceProvider.trim().length > 0 && policyNumber.trim().length > 0;
    }
    if (method === 'mtn_momo' || method === 'airtel_money') {
      return phoneNumber.trim().length > 0;
    }
    return true;
  })();

  const handleRecord = async () => {
    if (!canConfirmRecord) return;
    setSubmitting(true);
    try {
      const payload = {
        orderId: order.id,
        paymentMethod: method.toUpperCase(),
        amountReceived: method === 'cash' ? Number(amountReceived) : totalDue,
        phoneNumber: (method === 'mtn_momo' || method === 'airtel_money') ? phoneNumber : undefined,
        insuranceProvider: method === 'insurance' ? insuranceProvider : undefined,
        insurancePolicyNumber: method === 'insurance' ? policyNumber : undefined,
        reference: reference || undefined,
        notes: notes || undefined,
      };
      const res = await api.post('/payments/record', payload);
      setReceipt({
        receiptNumber: res.data.receiptNumber,
        amount: totalDue,
        method:
          method === 'insurance'
            ? `${t('cashier.insurance')} · ${insuranceProvider}`
            : t(`cashier.method_${method}`),
        timestamp: new Date().toLocaleString(),
        reference: reference || undefined,
      });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAndAdvance = async () => {
    try {
      await api.patch(`/orders/${order.id}/status`, { status: 'COMPLETED' });
      onAdvance(order.id);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
    onClose();
  };

  const tabBtn = (key: 'verify' | 'record', icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setTab(key)}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
        tab === key ? 'bg-brand-navy text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 bg-gray-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const patientName = `${order.patient.firstName} ${order.patient.lastName}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <DocumentTextIcon className="w-[18px] h-[18px] text-brand-navy" />
              <h2 className="text-lg font-semibold text-brand-navy">
                {t('cashier.processPaymentTitle')} — #{order.id.slice(0, 8)}
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              {patientName} · {order.orderItems.length}{' '}
              {order.orderItems.length === 1 ? t('cashier.item') : t('cashier.items')} ·{' '}
              <span className="font-semibold text-gray-800">{formatCurrency(totalDue)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={t('common.close') || 'Close'}
          >
            <XMarkIcon className="w-[18px] h-[18px]" />
          </button>
        </div>

        <div className="p-6">
          {confirming && !receipt ? (
            /* ── Confirmation step ── */
            <div className="space-y-5">
              <div className="flex flex-col items-center text-center py-2">
                <div className="h-12 w-12 rounded-full flex items-center justify-center mb-3 bg-amber-50">
                  <BanknotesIcon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">{t('cashier.confirmPaymentTitle', 'Confirm Payment')}</h3>
                <p className="text-sm text-gray-400 mt-0.5">{t('cashier.confirmPaymentSubtitle', 'Please review the details before processing.')}</p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2.5 text-sm">
                {[
                  [t('cashier.totalDue'),       fmt(totalDue)],
                  [t('cashier.paymentMethod'),  t(`cashier.method_${method}`)],
                  ...(method === 'cash'
                    ? [[t('cashier.amountReceived'), fmt(Number(amountReceived))],
                       [t('cashier.change'),         fmt(change)]]
                    : []),
                  ...(method === 'mtn_momo' || method === 'airtel_money'
                    ? [[t('cashier.phoneNumber') || 'Phone', phoneNumber]]
                    : []),
                  ...(method === 'insurance'
                    ? [[t('cashier.insuranceProvider'), insuranceProvider],
                       [t('cashier.policyNumber'),      policyNumber]]
                    : []),
                  ...(reference ? [[t('cashier.referenceNumber'), reference]] : []),
                  [t('cashier.cashierLabel'),   cashierName],
                ].map(([label, value], i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t('common.back', 'Back')}
                </button>
                <button
                  onClick={handleRecord}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 bg-brand-teal"
                >
                  {submitting ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      {t('cashier.processing')}
                    </>
                  ) : (
                    t('cashier.processPayment')
                  )}
                </button>
              </div>
            </div>
          ) : receipt ? (
            /* Receipt screen */
            <div className="space-y-5">
              <div className="flex flex-col items-center text-center py-4">
                <div className="h-14 w-14 rounded-full flex items-center justify-center mb-3 bg-brand-teal/10">
                  <CheckCircleIcon className="w-8 h-8 text-brand-teal" />
                </div>
                <h3 className="text-lg font-semibold text-brand-navy">
                  {t('cashier.paymentSuccessful')}
                </h3>
                <p className="text-sm text-gray-400">{t('cashier.receiptGenerated')}</p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-5 space-y-3">
                {[
                  [t('cashier.receiptNumber'), receipt.receiptNumber, 'font-mono font-medium'],
                  [t('cashier.orderId'), `#${order.id.slice(0, 8)}`, 'font-mono'],
                  [t('cashier.amount'), fmt(receipt.amount), 'font-semibold'],
                  [t('cashier.method'), receipt.method, 'font-medium'],
                  ...(receipt.reference ? [[t('cashier.reference'), receipt.reference, 'font-mono text-xs']] : []),
                  ['', null, ''],
                  [t('cashier.cashierLabel'), cashierName, 'text-gray-400'],
                  [t('cashier.timestamp'), receipt.timestamp, 'text-gray-400'],
                ].map(([label, value, cls], i) =>
                  !value ? (
                    <hr key={i} className="border-gray-100" />
                  ) : (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-400">{label}</span>
                      <span className={cls as string}>{value}</span>
                    </div>
                  )
                )}
              </div>

              <button
                onClick={handleCloseAndAdvance}
                className="w-full py-3 rounded-xl text-white font-medium transition-opacity hover:opacity-90 bg-brand-teal"
              >
                {t('cashier.closeAndAdvance')}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Tab switcher */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                {tabBtn('verify', <ShieldCheckIcon className="w-4 h-4" />, t('cashier.verifyTab'))}
                {tabBtn('record', <BanknotesIcon className="w-4 h-4" />, t('cashier.recordTab'))}
              </div>

              {/* Verify tab */}
              {tab === 'verify' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                    <p className="text-sm font-semibold text-brand-navy">
                      {t('cashier.orderSummary')}
                    </p>
                    <div className="space-y-1.5">
                      {order.orderItems.map((it, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {it.medication.name}{' '}
                            <span className="text-gray-400">× {it.quantity}</span>
                          </span>
                          <span className="font-medium">{fmt(it.price * it.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-semibold text-sm pt-2 border-t border-gray-200">
                      <span>{t('cashier.totalDue')}</span>
                      <span className="text-brand-navy">{formatCurrency(totalDue)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                    <div>
                      <p className="text-sm font-medium">{t('cashier.onlinePaymentStatus')}</p>
                      <p className="text-xs text-gray-400">{t('cashier.flutterwaveTransaction')}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        verifyStatus === 'confirmed'
                          ? 'bg-teal-50 text-teal-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {verifyStatus === 'confirmed' ? t('cashier.confirmed') : t('cashier.pendingStatus')}
                    </span>
                  </div>

                  <button
                    onClick={handleVerify}
                    disabled={verifyStatus === 'loading' || verifyStatus === 'confirmed'}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium transition-opacity hover:opacity-90 disabled:opacity-50 bg-brand-navy"
                  >
                    {verifyStatus === 'loading' ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        {t('cashier.verifying')}
                      </>
                    ) : (
                      <>
                        <ShieldCheckIcon className="w-4 h-4" />
                        {t('cashier.verifyTransaction')}
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Record tab */}
              {tab === 'record' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex justify-between text-sm">
                    <span className="text-gray-400">{t('cashier.totalDue')}</span>
                    <span className="font-semibold text-brand-navy">{formatCurrency(totalDue)}</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">{t('cashier.paymentMethod')}</label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 bg-white"
                      style={{ '--tw-ring-color': '#2D9B8A' } as React.CSSProperties}
                    >
                      <option value="cash">{t('cashier.method_cash')}</option>
                      <option value="card">{t('cashier.method_card')}</option>
                      <option value="mtn_momo">{t('cashier.method_mtn_momo')}</option>
                      <option value="airtel_money">{t('cashier.method_airtel_money')}</option>
                      <option value="insurance">{t('cashier.method_insurance')}</option>
                    </select>
                  </div>

                  {method === 'cash' && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        {t('cashier.amountReceived')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2"
                      />
                      <div className="flex justify-between text-sm rounded-lg bg-gray-50 px-3 py-2">
                        <span className="text-gray-400">{t('cashier.change')}</span>
                        <span className={`font-semibold ${change > 0 ? 'text-teal-600' : 'text-gray-700'}`}>
                          {formatCurrency(change)}
                        </span>
                      </div>
                    </div>
                  )}

                  {(method === 'mtn_momo' || method === 'airtel_money') && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        {t('cashier.phoneNumber') || 'Phone Number'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 078XXXXXXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2"
                      />
                    </div>
                  )}

                  {method !== 'cash' && method !== 'insurance' && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">{t('cashier.referenceNumber')}</label>
                      <input
                        type="text"
                        placeholder={t('cashier.referenceHint')}
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2"
                      />
                    </div>
                  )}

                  {method === 'insurance' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                          {t('cashier.insuranceProvider')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. RSSB, MMI"
                          value={insuranceProvider}
                          onChange={(e) => setInsuranceProvider(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                          {t('cashier.policyNumber')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder={t('cashier.policyHint')}
                          value={policyNumber}
                          onChange={(e) => setPolicyNumber(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">{t('cashier.notes')}</label>
                    <textarea
                      placeholder={t('cashier.notesPlaceholder')}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 resize-none"
                    />
                  </div>

                  <button
                    onClick={() => setConfirming(true)}
                    disabled={!canConfirmRecord}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium transition-opacity hover:opacity-90 disabled:opacity-50 bg-brand-teal"
                  >
                    {t('cashier.confirmPayment')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
