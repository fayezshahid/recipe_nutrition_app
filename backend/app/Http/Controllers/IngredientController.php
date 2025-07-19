<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Config;

use  App\Models\Ingredient;

class IngredientController extends Controller
{
    private $username;
    private $password;
    private $apiUrl;

    public function __construct()
    {
        $this->username = config('ingredientapi.username');
        $this->password = config('ingredientapi.password');
        $this->apiUrl = config('ingredientapi.url');
    }

    public function index()
    {
        $response = Http::withBasicAuth($this->username, $this->password)
            ->get($this->apiUrl);

        return $response->json();
    }

    public function search($name)
    {
        $response = Http::withBasicAuth($this->username, $this->password)
            ->get($this->apiUrl, [
                'ingredient' => $name
            ]);

        return $response->json();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'carbs' => 'required|numeric|min:0',
            'fat' => 'required|numeric|min:0',
            'protein' => 'required|numeric|min:0',
        ]);

        $formParams = [
            'name' => $validated['name'],
            'carbs' => $validated['carbs'],
            'fat' => $validated['fat'],
            'protein' => $validated['protein'],
        ];

        $response = Http::withBasicAuth($this->username, $this->password)
            ->asForm()
            ->post($this->apiUrl, $formParams);

        if ($response->successful()) {
            Ingredient::create([
                'name' => $validated['name']
            ]);
            return response()->json([
                'message' => 'Ingredient added successfully via external API',
                'response' => $response->json(),
            ], 201);
        } else {
            return response()->json([
                'message' => 'Failed to add ingredient via external API',
                'error' => $response->body(),
            ], $response->status());
        }
    }
}