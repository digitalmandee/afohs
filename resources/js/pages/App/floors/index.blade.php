@extends('layouts.app')

@section('content')
    <div class="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">🧱 Floor Management</h2>
            <div class="">
                <a href="{{ route('floors.create') }}"
                    class="inline-block bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded shadow">
                    ➕ Add New Floor
                </a>
                <a href="{{ route('tables.create') }}"
                    class="inline-block bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded shadow">
                    ➕ Add New table
                </a>
            </div>
        </div>

        @if (session('success'))
            <div class="mb-4 p-3 bg-green-100 text-green-800 border border-green-300 rounded">
                {{ session('success') }}
            </div>
        @endif

        <div class="overflow-x-auto bg-white rounded-lg shadow">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">#</th>
                        <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Floor Name</th>
                        <th class="px-6 py-3 text-right text-sm font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    @foreach ($floors as $floor)
                        <tr>
                            <td class="px-6 py-4 text-sm text-gray-800">{{ $loop->iteration }}</td>
                            <td class="px-6 py-4 text-sm text-gray-800">{{ $floor->name }}</td>
                            <td class="px-6 py-4 text-sm text-right space-x-2">
                                <a href="{{ route('floors.edit', $floor) }}"
                                    class="inline-block bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                                    ✏️ Edit
                                </a>
                                <form action="{{ route('floors.destroy', $floor->id) }}" method="POST"
                                    onsubmit="return confirm('Are you sure you want to delete this floor?');"
                                    class="inline-block">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit"
                                        class="inline-block bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                                        🗑️ Delete
                                    </button>
                                </form>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
@endsection
