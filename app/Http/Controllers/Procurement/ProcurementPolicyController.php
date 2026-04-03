<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Services\Procurement\ProcurementPolicyService;
use Illuminate\Http\Request;

class ProcurementPolicyController extends Controller
{
    public function __construct(
        private readonly ProcurementPolicyService $policyService
    ) {
    }

    public function show()
    {
        return response()->json([
            'policy' => $this->policyService->all(),
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'bill_requires_grn' => 'nullable|boolean',
            'valuation_method' => 'nullable|in:fifo,weighted_average',
            'po_amendment_mode' => 'nullable|in:disabled,admin_prospective',
        ]);

        $updated = $this->policyService->update($data);

        if ($request->expectsJson()) {
            return response()->json(['policy' => $updated]);
        }

        return back()->with('success', 'Procurement policy updated.');
    }
}
