<?php

namespace App\Http\Controllers;

use App\Helpers\FileHelper;
use App\Models\Employee;
use App\Models\EmployeeAsset;
use App\Models\EmployeeAssetAttachment;
use App\Models\Media;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class EmployeeAssetAttachmentController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('App/Admin/Employee/AssetAttachments/Index');
    }

    public function getAttachments(Request $request)
    {
        $limit = $request->query('limit', 10);
        $search = $request->query('search');

        $query = EmployeeAssetAttachment::with(['employee:id,name,employee_id,designation', 'asset', 'media']);

        if ($search) {
            $query->whereHas('employee', function ($q) use ($search) {
                $q
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('employee_id', 'like', "%{$search}%");
            })->orWhereHas('asset', function ($q) use ($search) {
                $q
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%");
            });
        }

        $attachments = $query->orderBy('created_at', 'desc')->paginate($limit)->through(function ($att) {
            $attArray = $att->toArray();
            try {
                $attArray['attachment_date'] = $att->attachment_date ? \Carbon\Carbon::parse($att->attachment_date)->format('d/m/Y') : '-';
            } catch (\Exception $e) {
            }
            return $attArray;
        });

        return response()->json([
            'success' => true,
            'attachments' => $attachments
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'employee_asset_id' => 'required|exists:employee_assets,id',
            'attachment_date' => 'required|date',
            'comments' => 'nullable|string',
            'status' => 'required|string|in:assigned,returned',
            'return_date' => 'nullable|date|after_or_equal:attachment_date',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['created_by'] = Auth::id();

        // Check if asset quantity is sufficient
        $asset = EmployeeAsset::find($data['employee_asset_id']);
        $currentAssignments = EmployeeAssetAttachment::where('employee_asset_id', $asset->id)
            ->where('status', 'assigned')
            ->count();

        if ($currentAssignments >= $asset->quantity) {
            return response()->json(['success' => false, 'message' => 'Insufficient asset quantity. All units are currently assigned.'], 422);
        }

        $attachment = EmployeeAssetAttachment::create($data);

        if ($request->hasFile('documents')) {
            foreach ($request->file('documents') as $file) {
                // Get file metadata BEFORE moving the file
                $fileName = $file->getClientOriginalName();
                $mimeType = $file->getMimeType();
                $fileSize = $file->getSize();

                // Now save the file
                $filePath = FileHelper::saveImage($file, 'attachment_documents');

                $attachment->media()->create([
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

        return response()->json(['success' => true, 'message' => 'Asset assigned successfully', 'attachment' => $attachment]);
    }

    public function update(Request $request, $id)
    {
        $attachment = EmployeeAssetAttachment::find($id);
        if (!$attachment) {
            return response()->json(['success' => false, 'message' => 'Attachment not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'employee_asset_id' => 'required|exists:employee_assets,id',
            'attachment_date' => 'required|date',
            'comments' => 'nullable|string',
            'status' => 'required|string|in:assigned,returned',
            'return_date' => 'nullable|date|after_or_equal:attachment_date',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['updated_by'] = Auth::id();

        $attachment->update($data);

        // Handle deletions of existing media
        if ($request->has('deleted_media_ids')) {
            $deletedIds = $request->input('deleted_media_ids');
            if (is_array($deletedIds)) {
                foreach ($deletedIds as $mediaId) {
                    $media = Media::find($mediaId);
                    if ($media && $media->mediable_id === $attachment->id && $media->mediable_type === get_class($attachment)) {
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
                $filePath = FileHelper::saveImage($file, 'attachment_documents');

                $attachment->media()->create([
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

        return response()->json(['success' => true, 'message' => 'Assignment updated successfully', 'attachment' => $attachment]);
    }

    public function destroy($id)
    {
        $attachment = EmployeeAssetAttachment::find($id);
        if (!$attachment) {
            return response()->json(['success' => false, 'message' => 'Attachment not found'], 404);
        }

        $attachment->deleted_by = Auth::id();
        $attachment->save();
        $attachment->delete();

        return response()->json(['success' => true, 'message' => 'Assignment deleted successfully']);
    }

    // Helper for Create/Edit forms
    public function getFormData()
    {
        $employees = Employee::select('id', 'name', 'employee_id')->whereNull('deleted_at')->get();
        // Only get active assets.
        $assets = EmployeeAsset::where('status', 'active')
            ->select('id', 'name', 'type', 'classification', 'quantity')
            ->get();

        return response()->json([
            'success' => true,
            'employees' => $employees,
            'assets' => $assets
        ]);
    }

    public function trashed(Request $request)
    {
        $limit = $request->query('limit', 10);
        $search = $request->query('search');

        $query = EmployeeAssetAttachment::onlyTrashed()->with(['employee:id,name,employee_id', 'asset:id,name,type']);

        if ($search) {
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $attachments = $query->orderBy('deleted_at', 'desc')->paginate($limit);

        return Inertia::render('App/Admin/Employee/AssetAttachments/Trashed', [
            'attachments' => $attachments
        ]);
    }

    public function restore($id)
    {
        $attachment = EmployeeAssetAttachment::onlyTrashed()->find($id);

        if (!$attachment) {
            return back()->with('error', 'Assignment not found.');
        }

        $attachment->restore();

        return back()->with('success', 'Assignment restored successfully.');
    }

    public function forceDelete($id)
    {
        $attachment = EmployeeAssetAttachment::onlyTrashed()->find($id);

        if (!$attachment) {
            return back()->with('error', 'Assignment not found.');
        }

        // Delete associated media
        foreach ($attachment->media as $media) {
            $media->deleteFile();
            $media->forceDelete();
        }

        $attachment->forceDelete();

        return back()->with('success', 'Assignment permanently deleted.');
    }
}
