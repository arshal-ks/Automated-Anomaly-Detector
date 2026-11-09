import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';
import { 
  Database, 
  Columns, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle, 
  Percent
} from 'lucide-react';

// Animated Count-Up Number Component
function AnimatedNumber({ value, isFloat = false, suffix = '' }) {
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, '')) || 0;
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    spring.set(numericValue);
  }, [numericValue, spring]);

  useEffect(() => {
    return spring.on('change', (latest) => {
      if (isFloat) {
        setDisplayValue(latest.toFixed(1));
      } else {
        setDisplayValue(Math.round(latest).toLocaleString());
      }
    });
  }, [spring, isFloat]);

  return (
    <span>
      {displayValue}
      {suffix}
    </span>
  );
}

export default function StatisticsCards({
  metadata,
  profiling,
  detection
}) {
  if (!metadata || !detection) return null;

  const totalRecords = metadata.total_rows || 0;
  const totalCols = metadata.total_columns || 0;
  const totalAnomalies = detection.total_anomalies || 0;
  const normalRecords = detection.normal_records || Math.max(0, totalRecords - totalAnomalies);
  const anomalyPct = detection.anomaly_percentage || 0;
  const missingCount = profiling?.total_missing_cells || 0;
  const missingPct = profiling?.missing_percentage || 0;

  const cards = [
    {
      id: 'rows',
      title: 'Total Records',
      value: totalRecords,
      subtitle: `${metadata.filename}`,
      icon: Database,
      iconBg: 'bg-[#EAF3FF]',
      iconColor: 'text-[#3987E8]',
      badgeColor: 'bg-[#EAF3FF] text-[#3987E8] border-[#DCEBFF]',
      badge: 'Ingested'
    },
    {
      id: 'cols',
      title: 'Total Columns',
      value: totalCols,
      subtitle: `${profiling?.numerical_columns_count || 0} Num • ${profiling?.categorical_columns_count || 0} Cat`,
      icon: Columns,
      iconBg: 'bg-[#F1F6FF]',
      iconColor: 'text-[#6AA8F5]',
      badgeColor: 'bg-[#F1F6FF] text-[#6AA8F5] border-[#DCEBFF]',
      badge: 'Features'
    },
    {
      id: 'anomalies',
      title: 'Anomalies Detected',
      value: totalAnomalies,
      subtitle: `${anomalyPct}% of records isolated`,
      icon: AlertTriangle,
      iconBg: 'bg-[#FFF0F2]',
      iconColor: 'text-[#E87583]',
      badgeColor: 'bg-[#FFF0F2] text-[#E87583] border-[#FED7DC]',
      badge: 'Outliers'
    },
    {
      id: 'normal',
      title: 'Normal Records',
      value: normalRecords,
      subtitle: `${(100 - anomalyPct).toFixed(1)}% verified clean`,
      icon: CheckCircle,
      iconBg: 'bg-[#EAF9F3]',
      iconColor: 'text-[#45B88A]',
      badgeColor: 'bg-[#EAF9F3] text-[#45B88A] border-[#C3EFDF]',
      badge: 'Clean'
    },
    {
      id: 'missing',
      title: 'Missing Values',
      value: missingCount,
      subtitle: `${missingPct}% total data cells`,
      icon: HelpCircle,
      iconBg: 'bg-[#FFF8EC]',
      iconColor: 'text-[#E9AC52]',
      badgeColor: 'bg-[#FFF8EC] text-[#E9AC52] border-[#FDE8C9]',
      badge: 'Imputed'
    },
    {
      id: 'pct',
      title: 'Anomaly Percentage',
      value: anomalyPct,
      isFloat: true,
      suffix: '%',
      subtitle: `${detection.selected_method_name || 'Ensemble Model'}`,
      icon: Percent,
      iconBg: 'bg-[#EAF3FF]',
      iconColor: 'text-[#3987E8]',
      badgeColor: 'bg-[#EAF3FF] text-[#3987E8] border-[#DCEBFF]',
      badge: 'Ratio'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 select-none">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.05 }}
            className="group relative bg-white rounded-[20px] p-5 border border-[#E2EAF5] shadow-[0_8px_24px_rgba(57,135,232,0.06)] hover:shadow-[0_14px_30px_rgba(57,135,232,0.12)] transition-all duration-300 hover:-translate-y-0.5 cursor-default"
          >
            {/* Top row: Title and Circular Icon */}
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[11px] font-bold text-[#7C8DA5] tracking-wide uppercase">
                {card.title}
              </span>
              <div className={`w-8 h-8 rounded-full ${card.iconBg} flex items-center justify-center ${card.iconColor} transition-transform group-hover:scale-105 shadow-xs`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Middle row: Big Number */}
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#26364D] tracking-tight">
                <AnimatedNumber value={card.value} isFloat={card.isFloat} suffix={card.suffix} />
              </span>
            </div>

            {/* Bottom row: Subtitle & status badge */}
            <div className="mt-3 pt-2.5 border-t border-[#E2EAF5] flex items-center justify-between">
              <p className="text-[11px] text-[#7C8DA5] font-medium truncate max-w-[100px] sm:max-w-[110px]" title={card.subtitle}>
                {card.subtitle}
              </p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
