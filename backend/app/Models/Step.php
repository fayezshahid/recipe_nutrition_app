<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Step extends Model
{
    protected $fillable = ['recipe_id', 'description', 'step_number'];

    public function recipe()
    {
        return $this->belongsTo(Recipe::class);
    }
}
