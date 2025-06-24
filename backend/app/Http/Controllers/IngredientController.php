<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

use  App\Models\Ingredient;

class IngredientController extends Controller
{
    public function index()
    {
        $response = Http::withBasicAuth('mfs', 'lzZ5ligBgA')
        ->get('https://interview.workcentrix.de/ingredients.php');

        return $response->json();
    }

    public function search($name)
    {
        $response = Http::withBasicAuth('mfs', 'lzZ5ligBgA')
            ->get('https://interview.workcentrix.de/ingredients.php', [
                'ingredient' => $name
            ]);

        return $response->json();
    }

    public function store(Request $request)
    {
        // Validate input
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'carbs' => 'required|numeric|min:0',
            'fat' => 'required|numeric|min:0',
            'protein' => 'required|numeric|min:0',
        ]);

        // Prepare form data
        $formParams = [
            'name' => $validated['name'],
            'carbs' => $validated['carbs'],
            'fat' => $validated['fat'],
            'protein' => $validated['protein'],
        ];

        // Send POST request with Basic Auth and x-www-form-urlencoded
        $response = Http::withBasicAuth('mfs', 'lzZ5ligBgA')
                        ->asForm()
                        ->post('https://interview.workcentrix.de/ingredients.php', $formParams);

        // Handle response
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
