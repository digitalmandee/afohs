@extends('layouts.app')

@section('content')
    <div class="max-w-xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">✏️ Edit Floor</h2>

        <form action="{{ route('floors.update', $floor->id) }}" method="POST"
            class="space-y-6 bg-white p-6 rounded-lg shadow">
            @csrf
            @method('PUT')

            <div>
                <label for="name" class="block text-sm font-medium text-gray-700">Floor Name</label>
                <input type="text" name="name" id="name" value="{{ $floor->name }}"
                    class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    required>
            </div>

            <div class="flex justify-end">
                <a href="{{ route('floors.index') }}"
                    class="mr-3 inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-md shadow-sm">
                    Cancel
                </a>
                <button type="submit"
                    class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md shadow-sm">
                    💾 Update Floor
                </button>
            </div>
        </form>
    </div>
@endsection
