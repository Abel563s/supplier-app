@component('mail::message')
# {{ $data['title'] }}

{{ $data['body'] }}

@if (! empty($data['supplier_name']))
**Supplier:** {{ $data['supplier_name'] }}
@endif

@if (! empty($data['url']))
[View in Supplier Portal]({{ $data['url'] }})
@endif

Thank you,<br>
The EEC Procurement Team
@endcomponent
