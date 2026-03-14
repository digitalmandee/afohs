<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Category;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PosReportController extends Controller
{
    public function index(Request $request)
    {
        // Get date range - default to today
        $startDate = $request->get('start_date', Carbon::today()->toDateString());
        $endDate = $request->get('end_date', Carbon::today()->toDateString());
        
        // Get tenant name (restaurant name)
        $tenant = tenant();
        $restaurantName = $tenant ? $tenant->name : 'RESTAURANT';
        
        // Get report data
        $reportData = $this->generateReportData($startDate, $endDate);
        
        return Inertia::render('App/Reports/PosReport', [
            'reportData' => $reportData,
            'restaurantName' => $restaurantName,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'filters' => $request->only(['start_date', 'end_date'])
        ]);
    }
    
    private function generateReportData($startDate, $endDate)
    {
        // Get all orders within date range
        $orders = Order::with(['orderItems'])
            ->whereBetween('start_date', [$startDate, $endDate])
            ->whereIn('status', ['completed', 'paid'])
            ->get();
        
        // Initialize report structure
        $reportData = [];
        $totalQuantity = 0;
        
        // Group items by category
        foreach ($orders as $order) {
            foreach ($order->orderItems as $orderItem) {
                $items = $orderItem->order_item;
                
                if (is_array($items)) {
                    foreach ($items as $item) {
                        $productId = $item['id'] ?? null;
                        $quantity = $item['quantity'] ?? 1;
                        $categoryName = $item['category'] ?? 'Uncategorized';
                        
                        if (!$productId) continue;
                        
                        // Initialize category if not exists
                        if (!isset($reportData[$categoryName])) {
                            $reportData[$categoryName] = [
                                'category_name' => $categoryName,
                                'items' => [],
                                'total_quantity' => 0
                            ];
                        }
                        
                        // Initialize item if not exists
                        $itemName = $item['name'] ?? 'Unknown Item';
                        if (!isset($reportData[$categoryName]['items'][$itemName])) {
                            $reportData[$categoryName]['items'][$itemName] = [
                                'name' => $itemName,
                                'quantity' => 0
                            ];
                        }
                        
                        // Add quantity
                        $reportData[$categoryName]['items'][$itemName]['quantity'] += $quantity;
                        $reportData[$categoryName]['total_quantity'] += $quantity;
                        $totalQuantity += $quantity;
                    }
                } else {
                    // Handle single item case
                    $productId = $items['id'] ?? null;
                    $quantity = $items['quantity'] ?? 1;
                    $categoryName = $items['category'] ?? 'Uncategorized';
                    
                    if (!$productId) continue;
                    
                    // Initialize category if not exists
                    if (!isset($reportData[$categoryName])) {
                        $reportData[$categoryName] = [
                            'category_name' => $categoryName,
                            'items' => [],
                            'total_quantity' => 0
                        ];
                    }
                    
                    // Initialize item if not exists
                    $itemName = $items['name'] ?? 'Unknown Item';
                    if (!isset($reportData[$categoryName]['items'][$itemName])) {
                        $reportData[$categoryName]['items'][$itemName] = [
                            'name' => $itemName,
                            'quantity' => 0
                        ];
                    }
                    
                    // Add quantity
                    $reportData[$categoryName]['items'][$itemName]['quantity'] += $quantity;
                    $reportData[$categoryName]['total_quantity'] += $quantity;
                    $totalQuantity += $quantity;
                }
            }
        }
        
        // Convert to array and sort
        $reportArray = array_values($reportData);
        
        // Sort categories by name
        usort($reportArray, function($a, $b) {
            return strcmp($a['category_name'], $b['category_name']);
        });
        
        // Sort items within each category by quantity (descending)
        foreach ($reportArray as &$category) {
            $category['items'] = array_values($category['items']);
            usort($category['items'], function($a, $b) {
                return $b['quantity'] - $a['quantity'];
            });
        }
        
        return [
            'categories' => $reportArray,
            'total_quantity' => $totalQuantity,
            'date_range' => [
                'start' => $startDate,
                'end' => $endDate
            ]
        ];
    }
    
    public function print(Request $request)
    {
        // Get date range - default to today
        $startDate = $request->get('start_date', Carbon::today()->toDateString());
        $endDate = $request->get('end_date', Carbon::today()->toDateString());
        
        // Get tenant name (restaurant name)
        $tenant = tenant();
        $restaurantName = $tenant ? $tenant->name : 'RESTAURANT';
        
        // Get report data
        $reportData = $this->generateReportData($startDate, $endDate);
        
        return Inertia::render('App/Reports/PosReportPrint', [
            'reportData' => $reportData,
            'restaurantName' => $restaurantName,
            'startDate' => $startDate,
            'endDate' => $endDate
        ]);
    }
}
