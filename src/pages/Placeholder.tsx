import React from 'react';

const Placeholder = ({ name }: { name: string }) => (
  <div className="pt-24 px-4 text-center">
    <h1 className="text-2xl font-bold text-white">{name} Page</h1>
    <p className="mt-4 text-slate-400">This page is currently under construction.</p>
  </div>
);

export default Placeholder;
