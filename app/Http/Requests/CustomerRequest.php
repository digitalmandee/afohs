<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CustomerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules()
    {
        return [
            'name'        => 'required|string|max:255',
            'contact'     => 'required|string|max:255',
            'gender'      => 'nullable|in:male,female,other',
            'guest_type_id' => 'required|exists:guest_types,id',
            'email'       => 'nullable|email',
            'cnic'        => 'nullable|string|max:255',
            'address'     => 'nullable|string|max:500',
            'member_name' => 'nullable|string|max:255',
            'member_no'   => 'nullable|string|max:255',
        ];
    }
}