<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function index()
    {
        $tax = Setting::firstOrCreate(
            ['type' => 'tax'],
            ['value' => 12]
        );
        $bankCharges = Setting::firstOrCreate(
            ['type' => 'bank_charges_percentage'],
            ['value' => 0]
        );

        return Inertia::render('App/Settings/EditTax', [
            'taxx' => $tax->value,
            'bank_charges_percentage' => $bankCharges->value,
        ]);
    }

    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tax' => 'nullable|numeric|min:0|max:100',
            'bank_charges_percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        if ($request->has('tax')) {
            $setting = Setting::firstOrCreate(['type' => 'tax']);
            $setting->value = $request->tax;
            $setting->save();
        }

        if ($request->has('bank_charges_percentage')) {
            $setting = Setting::firstOrCreate(['type' => 'bank_charges_percentage']);
            $setting->value = $request->bank_charges_percentage;
            $setting->save();
        }

        return response()->json([
            'message' => 'Settings updated successfully',
        ], 200);
    }

    public function showTax()
    {
        $tax = Setting::where('type', 'tax')->value('value') ?? 0;
        $billing = Setting::getGroup('billing');

        return response()->json([
            'tax' => $tax,
            'service_charges_percentage' => $billing['service_charges_percentage'] ?? 0,
            'bank_charges_value' => $billing['bank_charges_value'] ?? 0,
            'bank_charges_type' => $billing['bank_charges_type'] ?? 'percentage',
        ]);
    }

    public function getFinancialSettings()
    {
        $tax = Setting::where('type', 'tax')->value('value') ?? 12;

        // Fetch billing settings group which contains bank charges
        $billingSettings = Setting::where('type', 'billing')->value('value') ?? [];

        $bankChargesType = $billingSettings['bank_charges_type'] ?? 'percentage';
        $bankChargesValue = $billingSettings['bank_charges_value'] ?? 0;

        // Fallback to legacy setting if group setting is missing (optional)
        if (empty($billingSettings)) {
            $bankChargesValue = Setting::where('type', 'bank_charges_percentage')->value('value') ?? 0;
        }

        return response()->json([
            'tax' => $tax,
            'bank_charges_type' => $bankChargesType,
            'bank_charges_value' => $bankChargesValue,
        ]);
    }
}
