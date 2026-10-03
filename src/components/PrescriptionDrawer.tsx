import React, { useState } from 'react';
import { PRESCRIPTION_ITEMS, PHARMACIES } from '../data/mockData';
import { Language } from '../types';

interface PrescriptionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onReserveSuccess: (message: string) => void;
}

export const PrescriptionDrawer: React.FC<PrescriptionDrawerProps> = ({
  isOpen,
  onClose,
  language,
  onReserveSuccess,
}) => {
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | number>('riga');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>(PRESCRIPTION_ITEMS.map((i) => i.id));

  if (!isOpen) return null;

  const currentPharmacy = PHARMACIES.find((p) => p.id === selectedPharmacyId) || PHARMACIES[0];

  const filteredItems = PRESCRIPTION_ITEMS.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.indication.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCost = PRESCRIPTION_ITEMS.filter((item) => selectedItems.includes(item.id)).reduce(
    (acc, curr) => acc + curr.price,
    0
  );

  const insuranceCoverage = totalCost * 0.7;
  const patientPay = totalCost * 0.3;

  const toggleItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedItems.length === PRESCRIPTION_ITEMS.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(PRESCRIPTION_ITEMS.map((i) => i.id));
    }
  };

  const handleReserve = () => {
    onReserveSuccess(
      language === 'al'
        ? `Porosia me ${selectedItems.length} barna u dërgua me sukses te ${currentPharmacy.name}! Gatshme për marrje brenda 20 minutave.`
        : `Prescription basket (${selectedItems.length} items) successfully reserved at ${currentPharmacy.name}! Ready for pickup within 20 mins.`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-surface-container-high overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-surface-container flex items-center justify-between border-b border-surface-container-high">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-2xl">clinical_notes</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-headline-md text-lg sm:text-xl font-bold text-on-surface">
                  {language === 'al' ? 'Matrica e Recetave Klinike' : 'Prescription Fulfillment Matrix'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold font-label-tag">
                  20 {language === 'al' ? 'Produkte të Sinkronizuara' : 'Items Analyzed'}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {language === 'al' ? 'Disponueshmëria në kohë reale me: ' : 'Live stock cross-referenced with '}
                <span className="font-bold text-primary">{currentPharmacy.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container-lowest hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="px-4 sm:px-6 py-3 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-surface-container-high">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder={language === 'al' ? 'Kërko barin ose suplementin...' : 'Search medicine or mineral...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-lowest text-xs pl-8 pr-3 py-1.5 rounded-lg border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
              />
            </div>
            <button
              type="button"
              onClick={selectAll}
              className="px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-semibold text-primary border border-surface-container hover:bg-surface-container whitespace-nowrap"
            >
              {selectedItems.length === PRESCRIPTION_ITEMS.length
                ? (language === 'al' ? 'Çzgjidh të gjitha' : 'Deselect All')
                : (language === 'al' ? 'Zgjidh të 20-at' : 'Select All 20')}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-outline">{language === 'al' ? 'Barnatorja:' : 'Target Pharmacy:'}</span>
            <select
              value={selectedPharmacyId}
              onChange={(e) => setSelectedPharmacyId(e.target.value)}
              className="text-xs bg-surface-container-lowest border border-surface-container text-on-surface rounded-lg px-2.5 py-1.5 font-medium focus:outline-none"
            >
              {PHARMACIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.stockCount}/20 në stok)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Prescription Items Grid */}
        <div className="overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[480px]">
          {filteredItems.map((item) => {
            const isSelected = selectedItems.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 select-none ${
                  isSelected
                    ? 'bg-surface-container-lowest border-primary shadow-sm'
                    : 'bg-surface-container-low/70 border-surface-container opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'bg-primary text-on-primary' : 'border border-outline bg-white'
                    }`}
                  >
                    {isSelected && (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-on-surface leading-tight">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-outline mt-0.5">
                      {item.indication} • {item.dosage}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-xs sm:text-sm font-bold text-primary">
                    €{item.price.toFixed(2)}
                  </span>
                  <div className="text-[10px] text-secondary font-bold flex items-center gap-0.5 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    <span>{language === 'al' ? 'Në Stok' : 'In Stock'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Financial Breakdown & Action */}
        <div className="p-4 sm:p-6 bg-surface-container border-t border-surface-container-high flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-outline font-medium">
                {language === 'al' ? 'Kostoja Totale e Zgjedhur:' : 'Selected Total Prescriptions:'}
              </span>
              <span className="font-mono text-lg font-bold text-on-surface">
                €{totalCost.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-outline">
              {language === 'al'
                ? `Mbulimi nga Sigurimi Shëndetësor (70%): €${insuranceCoverage.toFixed(2)} • Pagesa e Pacientit: €${patientPay.toFixed(2)}`
                : `Kosovo Health Insurance Coverage (70%): €${insuranceCoverage.toFixed(2)} • Patient Copay: €${patientPay.toFixed(2)}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-container-highest transition-colors"
            >
              {language === 'al' ? 'Mbyll' : 'Close'}
            </button>
            <button
              type="button"
              onClick={handleReserve}
              disabled={selectedItems.length === 0}
              className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
              <span>
                {language === 'al'
                  ? `Rezervo Shportën (${selectedItems.length} Barna)`
                  : `Reserve Basket (${selectedItems.length} Items)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
