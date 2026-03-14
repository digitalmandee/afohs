import React from 'react';
import { router, useForm } from '@inertiajs/react';
import { Box, Typography } from '@mui/material';
import JournalForm from './JournalForm';

export default function Edit({ entry, accounts = [] }) {
  const { data, setData, put, processing, errors } = useForm({
    entry_date: entry?.entry_date || '',
    description: entry?.description || '',
    lines: (entry?.lines || []).map((line) => ({
      account_id: line.account_id || '',
      description: line.description || '',
      debit: line.debit || '',
      credit: line.credit || '',
    })),
  });

  const submit = () => {
    put(route('accounting.journals.update', entry.id));
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, color: 'primary.main', fontWeight: 700 }}>Edit Journal {entry.entry_no}</Typography>
      <JournalForm
        data={data}
        setData={setData}
        errors={errors}
        accounts={accounts}
        submitLabel="Update Draft"
        processing={processing}
        onSubmit={submit}
      />
      <Box sx={{ mt: 2 }}>
        <Typography
          variant="body2"
          color="primary.main"
          sx={{ cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => router.visit(route('accounting.journals.show', entry.id))}
        >
          Back to Journal
        </Typography>
      </Box>
    </Box>
  );
}

