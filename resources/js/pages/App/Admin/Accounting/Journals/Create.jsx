import React from 'react';
import { router, useForm } from '@inertiajs/react';
import { Box, Typography } from '@mui/material';
import JournalForm from './JournalForm';

export default function Create({ accounts = [] }) {
  const { data, setData, post, processing, errors } = useForm({
    entry_date: '',
    description: '',
    lines: [
      { account_id: '', description: '', debit: '', credit: '' },
      { account_id: '', description: '', debit: '', credit: '' },
    ],
  });

  const submit = () => {
    post(route('accounting.journals.store'));
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, color: 'primary.main', fontWeight: 700 }}>Create Journal Entry</Typography>
      <JournalForm
        data={data}
        setData={setData}
        errors={errors}
        accounts={accounts}
        submitLabel="Save Draft"
        processing={processing}
        onSubmit={submit}
      />
      <Box sx={{ mt: 2 }}>
        <Typography
          variant="body2"
          color="primary.main"
          sx={{ cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => router.visit(route('accounting.journals.index'))}
        >
          Back to Journals
        </Typography>
      </Box>
    </Box>
  );
}

