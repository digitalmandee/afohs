<?php

namespace App\Http\Controllers;

use App\Helpers\FileHelper;
use App\Models\EmployeeAsset;
use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class EmployeeAssetController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('App/Admin/Employee/Assets/Index');
    }

    public function getAssets(Request $request)
    {
        $limit = $request->query('limit', 10);
        $search = $request->query('search');

        $query = EmployeeAsset::with('media');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('classification', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        $assets = $query->orderBy('created_at', 'desc')->paginate($limit)->through(function ($asset) {
            $assetArray = $asset->toArray();
            try {
                $assetArray['acquisition_date'] = $assetArray['acquisition_date'] ? \Carbon\Carbon::parse($assetArray['acquisition_date'])->format('d/m/Y') : '-';
            } catch (\Exception $e) {
            }
            return $assetArray;
        });

        return response()->json([
            'success' => true,
            'assets' => $assets
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'classification' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'acquisition_date' => 'nullable|date',
            'location' => 'nullable|string|max:255',
            'quantity' => 'required|integer|min:0',
            'cost' => 'nullable|numeric|min:0',
            'status' => 'required|string|in:active,retired,lost,maintenance',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['created_by'] = Auth::id();

        $asset = EmployeeAsset::create($data);

        if ($request->hasFile('documents')) {
            foreach ($request->file('documents') as $file) {
                // Get file metadata BEFORE moving the file
                $fileName = $file->getClientOriginalName();
                $mimeType = $file->getMimeType();
                $fileSize = $file->getSize();

                // Now save the file
                $filePath = FileHelper::saveImage($file, 'asset_documents');

                $asset->media()->create([
                    'type' => 'document',
                    'file_name' => $fileName,
                    'file_path' => $filePath,
                    'mime_type' => $mimeType,
                    'file_size' => $fileSize,
                    'disk' => 'public',
                    'created_by' => Auth::id(),
                ]);
            }
        }

        return response()->json(['success' => true, 'message' => 'Asset created successfully', 'asset' => $asset]);
    }

    public function show($id)
    {
        $asset = EmployeeAsset::with('media')->find($id);
        if (!$asset) {
            return response()->json(['success' => false, 'message' => 'Asset not found'], 404);
        }
        return response()->json(['success' => true, 'asset' => $asset]);
    }

    public function update(Request $request, $id)
    {
        $asset = EmployeeAsset::find($id);
        if (!$asset) {
            return response()->json(['success' => false, 'message' => 'Asset not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'classification' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'acquisition_date' => 'nullable|date',
            'location' => 'nullable|string|max:255',
            'quantity' => 'required|integer|min:0',
            'cost' => 'nullable|numeric|min:0',
            'status' => 'required|string|in:active,retired,lost,maintenance',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['updated_by'] = Auth::id();

        $asset->update($data);

        // Handle deletions of existing media
        if ($request->has('deleted_media_ids')) {
            $deletedIds = $request->input('deleted_media_ids');
            if (is_array($deletedIds)) {
                foreach ($deletedIds as $mediaId) {
                    $media = Media::find($mediaId);
                    if ($media && $media->mediable_id === $asset->id && $media->mediable_type === get_class($asset)) {
                        $media->deleteFile();
                        $media->delete();
                    }
                }
            }
        }

        if ($request->hasFile('documents')) {
            foreach ($request->file('documents') as $file) {
                // Get file metadata BEFORE moving the file
                $fileName = $file->getClientOriginalName();
                $mimeType = $file->getMimeType();
                $fileSize = $file->getSize();

                // Now save the file
                $filePath = FileHelper::saveImage($file, 'asset_documents');

                $asset->media()->create([
                    'type' => 'document',
                    'file_name' => $fileName,
                    'file_path' => $filePath,
                    'mime_type' => $mimeType,
                    'file_size' => $fileSize,
                    'disk' => 'public',
                    'created_by' => Auth::id(),
                ]);
            }
        }

        return response()->json(['success' => true, 'message' => 'Asset updated successfully', 'asset' => $asset]);
    }

    public function destroy($id)
    {
        $asset = EmployeeAsset::find($id);
        if (!$asset) {
            return response()->json(['success' => false, 'message' => 'Asset not found'], 404);
        }

        $asset->deleted_by = Auth::id();
        $asset->save();
        $asset->delete();

        return response()->json(['success' => true, 'message' => 'Asset deleted successfully']);
    }

    // Helper to get asset options (types, classifications) for forms if needed
    public function getOptions()
    {
        // Fetch distinct RAW values
        $classificationsRaw = EmployeeAsset::distinct()->pluck('classification')->filter()->values();
        $typesRaw = EmployeeAsset::distinct()->pluck('type')->filter()->values();
        $locationsRaw = EmployeeAsset::distinct()->pluck('location')->filter()->values();

        // Helper to split comma-separated strings and get unique items
        $processOptions = function ($items) {
            $all = [];
            foreach ($items as $item) {
                // Split by comma, trim whitespace
                $parts = array_map('trim', explode(',', $item));
                $all = array_merge($all, $parts);
            }
            return array_values(array_unique(array_filter($all)));
        };

        return response()->json([
            'success' => true,
            'classifications' => $processOptions($classificationsRaw),
            'types' => $processOptions($typesRaw),
            'locations' => $processOptions($locationsRaw),
        ]);
    }

    public function trashed(Request $request)
    {
        $limit = $request->query('limit', 10);
        $search = $request->query('search');

        $query = EmployeeAsset::onlyTrashed();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('classification', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%");
            });
        }

        $assets = $query->orderBy('deleted_at', 'desc')->paginate($limit);

        return Inertia::render('App/Admin/Employee/Assets/Trashed', [
            'assets' => $assets
        ]);
    }

    public function restore($id)
    {
        $asset = EmployeeAsset::onlyTrashed()->find($id);

        if (!$asset) {
            return back()->with('error', 'Asset not found.');
        }

        $asset->restore();

        return back()->with('success', 'Asset restored successfully.');
    }

    public function forceDelete($id)
    {
        $asset = EmployeeAsset::onlyTrashed()->find($id);

        if (!$asset) {
            return back()->with('error', 'Asset not found.');
        }

        // Delete associated media files
        foreach ($asset->media as $media) {
            $media->deleteFile();
            $media->forceDelete();
        }

        $asset->forceDelete();

        return back()->with('success', 'Asset permanently deleted.');
    }
}
