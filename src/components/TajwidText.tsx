import React, { useMemo } from 'react';
import { parseTajwidSegments, TAJWID_CLASS_MAP } from '../utils/tajwid';

interface TajwidTextProps {
  text: string;
  enabled: boolean;
}

export const TajwidText: React.FC<TajwidTextProps> = React.memo(({ text, enabled }) => {
  const segments = useMemo(() => {
    if (!enabled) return null;
    return parseTajwidSegments(text);
  }, [text, enabled]);

  if (!enabled || !segments) {
    return <>{text}</>;
  }

  return (
    <>
      {segments.map((seg, idx) =>
        seg.rule ? (
          <span key={idx} className={TAJWID_CLASS_MAP[seg.rule]}>
            {seg.text}
          </span>
        ) : (
          <React.Fragment key={idx}>{seg.text}</React.Fragment>
        ),
      )}
    </>
  );
});

TajwidText.displayName = 'TajwidText';
