<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = Setting::getGroup('billing');
        $tax = Setting::where('type', 'tax')->value('value') ?? 12;
        $bankCharges = Setting::where('type', 'bank_charges_percentage')->value('value') ?? 0;

        return inertia('App/Admin/Settings/Billing', [
            'settings' => $settings,
            'tax' => $tax,
            'bank_charges_type' => $settings['bank_charges_type'] ?? 'percentage',
            'bank_charges_value' => $settings['bank_charges_value'] ?? 0,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'overdue_charge_pct' => 'required|numeric|min:0',
            'penalty_quarter_pct' => 'required|array',
            'penalty_quarter_pct.*' => 'required|numeric|min:0',
            'reinstatement_fees' => 'required|array',
            'reinstatement_fees.*' => 'required|numeric|min:0',
            'tax' => 'nullable|numeric|min:0|max:100',
            'bank_charges_type' => 'nullable|string|in:percentage,fixed',
            'bank_charges_value' => 'nullable|numeric|min:0',
            'service_charges_percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        // Separate tax setting
        $tax = $validated['tax'] ?? 12;
        unset($validated['tax']);
        // bank charges now part of 'billing' group settings

        // Update Billing Group (includes bank charges settings now)
        Setting::updateGroup('billing', $validated);

        Setting::updateOrCreate(
            ['type' => 'tax'],
            ['value' => $tax]
        );

        return back()->with('success', 'Settings updated successfully.');
    }
}
