import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Loader2, AlertCircle } from 'lucide-react';
import Button from './Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const FoodSearchDropdown = ({ date, onFoodAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState(null);
  
  // Custom Food Form State
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customServingUnit, setCustomServingUnit] = useState('100g');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [submittingCustom, setSubmittingCustom] = useState(false);

  const containerRef = useRef(null);

  // Fetch foods once when the dropdown is opened
  const fetchFoods = async () => {
    if (foods.length > 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/foods`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setFoods(data);
      } else {
        throw new Error('Failed to load food database');
      }
    } catch (err) {
      console.error(err);
      setError('Could not load foods library');
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter foods client-side
  const filteredFoods = foods.filter(food =>
    food.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDropdown = () => {
    setIsOpen(true);
    fetchFoods();
  };

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setSearch(food.name);
    setIsOpen(false);
    setError(null);
  };

  const handleAddFood = async (e) => {
    e.preventDefault();
    if (!selectedFood) return;
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/logs/${date}/food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          foodId: selectedFood._id,
          source: selectedFood.source,
          quantity: qty,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to log food');
      }

      const updatedLog = await res.json();
      onFoodAdded(updatedLog);
      
      // Reset state
      setSelectedFood(null);
      setSearch('');
      setQuantity('1');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error adding food');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndLogCustom = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!customName.trim()) {
      setError('Custom food name is required');
      return;
    }
    if (!customServingUnit.trim()) {
      setError('Serving unit is required');
      return;
    }
    
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    const calories = Number(customCalories || 0);
    const protein = Number(customProtein || 0);
    const carbs = Number(customCarbs || 0);
    const fat = Number(customFat || 0);

    if (calories < 0 || protein < 0 || carbs < 0 || fat < 0) {
      setError('Macros cannot be negative');
      return;
    }

    setSubmittingCustom(true);
    try {
      // 1. Create Custom Food
      const createRes = await fetch(`${API_URL}/api/foods/custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: customName.trim(),
          servingUnit: customServingUnit.trim(),
          caloriesPerServing: calories,
          proteinPerServing: protein,
          carbsPerServing: carbs,
          fatPerServing: fat,
        }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.message || 'Failed to save custom food to library');
      }

      const createdFood = await createRes.json();

      // 2. Append newly created food to the local cache list in memory so it is available!
      setFoods(prev => {
        const updated = [...prev, createdFood];
        return updated.sort((a, b) => a.name.localeCompare(b.name));
      });

      // 3. Log it immediately
      const logRes = await fetch(`${API_URL}/api/logs/${date}/food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          foodId: createdFood._id,
          source: 'custom',
          quantity: qty,
        }),
      });

      if (!logRes.ok) {
        const errData = await logRes.json();
        throw new Error(errData.message || 'Failed to log custom food');
      }

      const updatedLog = await logRes.json();
      onFoodAdded(updatedLog);

      // Reset form states
      setCustomName('');
      setCustomServingUnit('100g');
      setCustomCalories('');
      setCustomProtein('');
      setCustomCarbs('');
      setCustomFat('');
      setQuantity('1');
      setShowCustomForm(false);
      setSearch('');
      setSelectedFood(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error processing custom food');
    } finally {
      setSubmittingCustom(false);
    }
  };

  return (
    <div ref={containerRef} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!showCustomForm ? (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-[var(--text-muted-color)] uppercase tracking-wider">
            Search Food Library
          </label>
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-4.5 h-4.5 text-[var(--text-muted-color)]/60" />
              <input
                type="text"
                placeholder="Search food (e.g. chicken breast, egg)..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setIsOpen(true);
                  if (selectedFood && e.target.value !== selectedFood.name) {
                    setSelectedFood(null);
                  }
                }}
                onFocus={handleOpenDropdown}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[var(--text-muted-color)]/10 bg-[var(--surface-color)]/50 text-sm text-[var(--text-color)] placeholder-[var(--text-muted-color)]/60 focus:outline-none focus:border-[#FF4D2E]/50 focus:bg-[var(--bg-color)] transition-all"
              />
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute z-10 w-full mt-2 rounded-2xl border border-[var(--text-muted-color)]/10 bg-[var(--bg-color)] shadow-xl max-h-60 overflow-y-auto divide-y divide-[var(--text-muted-color)]/5 backdrop-blur-md">
                {loading ? (
                  <div className="p-4 flex items-center justify-center gap-2 text-xs text-[var(--text-muted-color)]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#FF4D2E]" />
                    <span>Loading library...</span>
                  </div>
                ) : filteredFoods.length > 0 ? (
                  filteredFoods.map((food) => (
                    <button
                      key={food._id}
                      type="button"
                      onClick={() => handleSelectFood(food)}
                      className="w-full px-4 py-3 text-left hover:bg-[var(--surface-color)]/60 flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-[var(--text-color)] group-hover:text-[#FF5236] transition-colors">
                          {food.name}
                        </p>
                        <p className="text-xs text-[var(--text-muted-color)]">
                          Per serving: {food.servingUnit} ({food.caloriesPerServing} kcal)
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                        food.source === 'custom' 
                          ? 'bg-[#FF4D2E]/10 text-[#FF5236]' 
                          : 'bg-[var(--text-muted-color)]/10 text-[var(--text-muted-color)]'
                      }`}>
                        {food.source}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-sm text-[var(--text-muted-color)]">
                    No matching foods found.
                  </div>
                )}
                
                {/* Add Custom Food Option */}
                {!loading && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomForm(true);
                      setIsOpen(false);
                      if (search.trim()) {
                        setCustomName(search);
                      }
                    }}
                    className="w-full px-4 py-3.5 text-left text-xs font-semibold text-[#FF5236] hover:bg-[#FF4D2E]/5 flex items-center gap-2 border-t border-[var(--text-muted-color)]/10 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create & log new custom food "{search || '...'}"</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Add selected food controls */}
          {selectedFood && (
            <div className="flex items-end gap-3 p-4 rounded-2xl bg-[var(--surface-color)]/30 border border-[var(--text-muted-color)]/5 animate-fade-in">
              <div className="flex-1 space-y-1">
                <label htmlFor="food-quantity" className="text-xs font-semibold text-[var(--text-muted-color)] uppercase tracking-wider">
                  Quantity ({selectedFood.servingUnit})
                </label>
                <input
                  id="food-quantity"
                  type="number"
                  min="0.01"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--text-muted-color)]/10 bg-[var(--bg-color)] text-sm text-[var(--text-color)] focus:outline-none focus:border-[#FF4D2E]/50 transition-all"
                />
              </div>
              <Button
                type="button"
                onClick={handleAddFood}
                disabled={loading}
                className="h-[42px] px-6"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Inline Custom Food Form */
        <div className="p-5 rounded-2xl border border-[#FF4D2E]/20 bg-[#FF4D2E]/5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[var(--text-color)]">Create Custom Food</h4>
            <button
              type="button"
              onClick={() => {
                setShowCustomForm(false);
                setError(null);
              }}
              className="text-xs text-[var(--text-muted-color)] hover:text-[var(--text-color)] transition-colors animate-fade-in"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="col-span-2 space-y-1">
              <label htmlFor="custom-food-name" className="text-[10px] font-semibold text-[var(--text-muted-color)] uppercase tracking-wider">Food Name</label>
              <input
                id="custom-food-name"
                type="text"
                placeholder="e.g. Grandma's Lasagna"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--text-muted-color)]/10 bg-[var(--bg-color)] text-sm text-[var(--text-color)] focus:outline-none focus:border-[#FF4D2E]/50 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="custom-serving-unit" className="text-[10px] font-semibold text-[var(--text-muted-color)] uppercase tracking-wider">Serving Unit</label>
              <input
                id="custom-serving-unit"
                type="text"
                placeholder="e.g. 1 slice, 150g"
                value={customServingUnit}
                onChange={(e) => setCustomServingUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--text-muted-color)]/10 bg-[var(--bg-color)] text-sm text-[var(--text-color)] focus:outline-none focus:border-[#FF4D2E]/50 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="custom-qty" className="text-[10px] font-semibold text-[var(--text-muted-color)] uppercase tracking-wider">Quantity to Log</label>
              <input
                id="custom-qty"
                type="number"
                min="0.01"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--text-muted-color)]/10 bg-[var(--bg-color)] text-sm text-[var(--text-color)] focus:outline-none focus:border-[#FF4D2E]/50 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="custom-calories" className="text-[10px] font-semibold text-[var(--text-muted-color)] uppercase tracking-wider">Calories (kcal)</label>
              <input
                id="custom-calories"
                type="number"
                min="0"
                placeholder="0"
                value={customCalories}
                onChange={(e) => setCustomCalories(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--text-muted-color)]/10 bg-[var(--bg-color)] text-sm text-[var(--text-color)] focus:outline-none focus:border-[#FF4D2E]/50 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="custom-protein" className="text-[10px] font-semibold text-[var(--text-muted-color)] uppercase tracking-wider">Protein (g)</label>
              <input
                id="custom-protein"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={customProtein}
                onChange={(e) => setCustomProtein(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--text-muted-color)]/10 bg-[var(--bg-color)] text-sm text-[var(--text-color)] focus:outline-none focus:border-[#FF4D2E]/50 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="custom-carbs" className="text-[10px] font-semibold text-[var(--text-muted-color)] uppercase tracking-wider">Carbs (g)</label>
              <input
                id="custom-carbs"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={customCarbs}
                onChange={(e) => setCustomCarbs(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--text-muted-color)]/10 bg-[var(--bg-color)] text-sm text-[var(--text-color)] focus:outline-none focus:border-[#FF4D2E]/50 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="custom-fat" className="text-[10px] font-semibold text-[var(--text-muted-color)] uppercase tracking-wider">Fat (g)</label>
              <input
                id="custom-fat"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={customFat}
                onChange={(e) => setCustomFat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--text-muted-color)]/10 bg-[var(--bg-color)] text-sm text-[var(--text-color)] focus:outline-none focus:border-[#FF4D2E]/50 transition-all"
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={handleCreateAndLogCustom}
            disabled={submittingCustom}
            className="w-full py-2.5 flex items-center justify-center gap-2"
          >
            {submittingCustom ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating and Logging...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Create & Log Food</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FoodSearchDropdown;
