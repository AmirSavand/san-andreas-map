/**
 * App
 */
let app = angular.module("san-andreas-map", []);

/**
 * App config
 */
app.config(function ($locationProvider) {
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });
});

/**
 * Map
 */
app.service("Map", function ($window) {
  /**
   * @private
   */
  let self = this;
  /**
   * @type {object}
   */
  self.element = angular.element("body");
  /**
   * @type {number}
   */
  self.maxSize = 6000;
  /**
   * @type {number}
   */
  self.size = self.maxSize;
  /**
   * Convert map point to web point
   *
   * @type {function}
   * @returns {object}
   *
   * @param {number} point
   */
  self.getCoordinate = function (point) {
    let factor = self.size / self.maxSize;
    let base = (self.maxSize / 2) * factor;
    return base + (point * factor);
  };
  /**
   * Convert map size to web size
   *
   * @type {function}
   * @returns {number}
   *
   * @param {number} size
   */
  self.getSize = function (size) {
    return size * (self.size / self.maxSize);
  };
  /**
   * @type {function}
   * @returns {null}
   *
   * @param {zoomIn} boolean
   */
  self.zoom = function (zoomIn) {
    let min = self.element.width();
    let amount = 500;
    if (zoomIn) {
      self.size -= amount;
    } else {
      self.size += amount;
    }
    if (self.size < min) {
      self.size = min;
    } else if (self.size > self.maxSize) {
      self.size = self.maxSize;
    }
  };
  /**
   * @type {function}
   * @returns {null}
   *
   * @param {direction} string
   */
  self.move = function (direction) {
    let amount = 500;
    let element = angular.element("html, body");
    let window = angular.element($window);
    if (direction == "up") {
      animate = { scrollTop: window.scrollTop() - amount };
    } else if (direction == "down") {
      animate = { scrollTop: window.scrollTop() + amount };
    } else if (direction == "left") {
      animate = { scrollLeft: window.scrollLeft() - amount };
    } else if (direction == "right") {
      animate = { scrollLeft: window.scrollLeft() + amount };
    }
    element.stop().animate(animate, 200, "linear");
  };
});

/**
 * Storm
 */
app.service("Storm", function (Map) {
  /**
   * @type {private}
   */
  var self = this;
  /**
   * @type {number}
   */
  self.diameter = 3000;
  /**
   * @type {object}
   */
  self.position = {
    x: 0,
    y: 0,
  };
  /**
   * @type {function}
   * @returns {string}
   */
  self.getStyle = function () {
    // Convert size
    let size = Map.getSize(self.diameter);
    // Converted position
    let position = {
      x: Map.getCoordinate(self.position.x) - (size / 2),
      y: Map.getCoordinate(self.position.y) - (size / 2),
    };
    // Final style
    return (
      "left:" + position.x + "px;" +
      "top:" + position.y + "px;" +
      "width:" + size + "px;" +
      "height:" + size + "px;"
    );
  };
});

/**
 * Marker
 */
app.service("Marker", function (Map) {
  return function (data) {
    /**
     * @private
     */
    let self = this;
    /**
     * @type {number}
     */
    self.id = data.id;
    /**
     * @type {string}
     */
    self.title = data.title;
    /**
     * @type {string}
     */
    self.icon = data.icon;
    /**
     * @type {Array<object>}
     */
    self.properties = data.properties;
    /**
     * @type {object}
     */
    self.position = {
      x: data.position.x,
      y: data.position.y
    };
    /**
     * @type {function}
     * @returns {string}
     */
    self.getContent = function () {
      let content = "";
      angular.forEach(self.properties, function (value, property) {
        content += property + ": " + value + "\n";
      });
      return content;
    };
    /**
     * @type {function}
     * @returns {string}
     */
    self.getStyle = function () {
      // Get converted position
      let position = {
        x: Map.getCoordinate(self.position.x),
        y: Map.getCoordinate(self.position.y),
      };
      // Final style
      return "left: " + position.x + "px; top: " + position.y + "px";
    };
  };
});

/**
 * Main controller
 */
app.controller("MainController", function (Map, Storm, Marker, $scope, $window, $timeout, $location, $http) {
  /**
   * Constructor
   */
  function constructor() {
    /**
     * @type {boolean}
     */
    $scope.loading = true;
    /**
     * @type {Map}
     */
    $scope.map = Map;
    /**
     * @type {Array<Marker>}
     */
    $scope.markers = [];
    /**
     * Get markers from API
     */
    getMarkers();
  }
  /**
   * Get markers from API
   */
  function getMarkers() {
    /**
     * Get API URL from URL params
     */
    let apiUrl = $location.search().api || "static/sample.json";
    /**
     * Get from API
     */
    $http.get(apiUrl).then(function (data) {
      let res = data.data;
      /**
       * Load storm
       */
      if (res.storm) {
        Storm.diameter = res.storm.diameter;
        Storm.position = res.storm.position;
        $scope.storm = Storm;
      } else {
        delete $scope.storm;
      }
      /**
       * Load markers
       */
      // Remove existing popovers
      angular.element(".popover.show").removeClass("show");
      // Reset all markers
      $scope.markers = [];
      // Add all markers
      angular.forEach(res.points, function (point) {
        $scope.markers.push(new Marker(point));
      });
      /**
       * Initial bootstrap popovers for markers
       */
      $timeout(function () {
        angular.element("[data-toggle=popover]").popover({
          placement: "top",
          trigger: "hover",
        });
      });
      /**
       * Refresh again
       */
      if (res.config.interval < 3000) {
        res.config.interval = 3000;
      }
      $timeout(getMarkers, res.config.interval);
    });
  }
  /**
   * On page load
   */
  angular.element($window).on("load", function () {
    // On content rendered
    $timeout(function () {
      // Fully zoom out map
      Map.size = 0;
      Map.zoom(false);
      // After a while
      $timeout(function () {
        // Scroll to middle of the map
        let scrollTop = (angular.element("body").height() / 2) - ($window.innerHeight / 2);
        angular.element("html, body").animate({
          scrollTop: scrollTop
        }, 200);
        // Loading is done
        $scope.loading = false;
      }, 2000);
    });
  });

  constructor();
});
