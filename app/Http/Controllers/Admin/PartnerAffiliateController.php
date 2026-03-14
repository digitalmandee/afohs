<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\PartnerAffiliate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PartnerAffiliateController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = PartnerAffiliate::query()->latest();

        if ($request->input('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q
                    ->where('organization_name', 'like', "%{$search}%")
                    ->orWhere('focal_person_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->input('type') && $request->input('type') !== 'all') {
            $query->where('type', $request->input('type'));
        }

        if ($request->input('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        $partners = $query->paginate(15)->withQueryString();

        return Inertia::render('App/Admin/Membership/PartnersAffiliates/Index', [
            'partners' => $partners,
            'filters' => $request->only(['search', 'type', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('App/Admin/Membership/PartnersAffiliates/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string',
            'organization_name' => 'required|string',
            'facilitation_details' => 'nullable|string',
            'address' => 'required|string',
            'telephone' => 'required|string',
            'mobile_a' => 'required|string',
            'mobile_b' => 'nullable|string',
            'email' => 'required|email',
            'website' => 'nullable|url',
            'focal_person_name' => 'required|string',
            'focal_mobile_a' => 'required|string',
            'focal_mobile_b' => 'nullable|string',
            'focal_telephone' => 'nullable|string',
            'focal_email' => 'required|email',
            'agreement_date' => 'required|date',
            'agreement_end_date' => 'nullable|date|after_or_equal:agreement_date',
            'status' => 'required|string|in:Active,Inactive',
            'comments' => 'nullable|string',
            'documents' => 'nullable|array',
            'documents.*' => 'file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $partner = PartnerAffiliate::create($validated);

        if ($request->hasFile('documents')) {
            foreach ($request->file('documents') as $file) {
                $path = $file->store('partner_documents', 'public');

                $media = new Media([
                    'type' => 'document',
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'mime_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                    'disk' => 'public',
                    'created_by' => auth()->id(),
                ]);

                $partner->media()->save($media);
            }
        }

        return redirect()
            ->route('admin.membership.partners-affiliates.index')
            ->with('success', 'Partner/Affiliate created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PartnerAffiliate $partnersAffiliate)
    {
        $partnersAffiliate->load('media');

        return Inertia::render('App/Admin/Membership/PartnersAffiliates/Create', [
            'partner' => $partnersAffiliate,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PartnerAffiliate $partnersAffiliate)
    {
        $validated = $request->validate([
            'type' => 'required|string',
            'organization_name' => 'required|string',
            'facilitation_details' => 'nullable|string',
            'address' => 'required|string',
            'telephone' => 'required|string',
            'mobile_a' => 'required|string',
            'mobile_b' => 'nullable|string',
            'email' => 'required|email',
            'website' => 'nullable|url',
            'focal_person_name' => 'required|string',
            'focal_mobile_a' => 'required|string',
            'focal_mobile_b' => 'nullable|string',
            'focal_telephone' => 'nullable|string',
            'focal_email' => 'required|email',
            'agreement_date' => 'required|date',
            'agreement_end_date' => 'nullable|date|after_or_equal:agreement_date',
            'status' => 'required|string|in:Active,Inactive',
            'comments' => 'nullable|string',
            'documents' => 'nullable|array',
            'documents.*' => 'file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $partnersAffiliate->update($validated);

        if ($request->hasFile('documents')) {
            foreach ($request->file('documents') as $file) {
                $path = $file->store('partner_documents', 'public');

                $media = new Media([
                    'type' => 'document',
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'mime_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                    'disk' => 'public',
                    'created_by' => auth()->id(),
                ]);

                $partnersAffiliate->media()->save($media);
            }
        }

        return redirect()
            ->route('admin.membership.partners-affiliates.index')
            ->with('success', 'Partner/Affiliate updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PartnerAffiliate $partnersAffiliate)
    {
        $partnersAffiliate->delete();

        return redirect()
            ->route('admin.membership.partners-affiliates.index')
            ->with('success', 'Partner/Affiliate deleted successfully.');
    }

    public function search(Request $request)
    {
        $query = $request->input('query');

        if (!$query) {
            return response()->json(['partners' => []]);
        }

        $partners = PartnerAffiliate::where(function ($q) use ($query) {
            $q
                ->where('organization_name', 'like', "%{$query}%")
                ->orWhere('focal_person_name', 'like', "%{$query}%")
                ->orWhere('email', 'like', "%{$query}%");
        })
            ->select('id', 'organization_name', 'focal_person_name', 'email', 'status', 'type')
            ->limit(10)
            ->get();

        return response()->json(['partners' => $partners]);
    }

    public function trashed(Request $request)
    {
        $query = PartnerAffiliate::onlyTrashed();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q
                    ->where('organization_name', 'like', "%{$search}%")
                    ->orWhere('focal_person_name', 'like', "%{$search}%");
            });
        }

        $partners = $query->orderBy('deleted_at', 'desc')->paginate(10);

        return Inertia::render('App/Admin/Membership/PartnersAffiliates/TrashedPartners', [
            'partners' => $partners,
            'filters' => $request->only(['search']),
        ]);
    }

    public function restore($id)
    {
        $partner = PartnerAffiliate::withTrashed()->findOrFail($id);
        $partner->restore();

        return redirect()->back()->with('success', 'Partner/Affiliate restored successfully.');
    }
}
