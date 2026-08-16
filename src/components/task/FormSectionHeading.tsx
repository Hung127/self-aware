import React from 'react';

interface FormSectionHeadingProps {
  step: string;
  title: string;
  description: string;
}

export const FormSectionHeading: React.FC<FormSectionHeadingProps> = ({ step, title, description }) => (
  <div className="border-b border-border pb-2">
    <p className="text-xs font-bold uppercase tracking-wider text-primary-ink">
      {step}. {title}
    </p>
    <p className="mt-0.5 text-xs text-text-muted">{description}</p>
  </div>
);
