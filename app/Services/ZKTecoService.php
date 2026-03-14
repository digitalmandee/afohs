<?php

namespace App\Services;

use Rats\Zkteco\Lib\ZKTeco;

class ZKTecoService
{
    protected $zk;

    public function __construct()
    {
        $ip = '192.168.1.201'; // Device IP Address
        $port = 4370; // Default port for ZKTeco

        $this->zk = new ZKTeco($ip, $port);
    }

    public function getAttendance()
    {
        if ($this->zk->connect()) {
            $attendance = $this->zk->getAttendance();
            $this->zk->disconnect();
            return $attendance;
        }
        return null;
    }
}