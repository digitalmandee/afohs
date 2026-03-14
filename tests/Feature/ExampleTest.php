<?php

it('renders the login page', function () {
    $response = $this->get(route('pos.login'));

    $response->assertStatus(200);
});
